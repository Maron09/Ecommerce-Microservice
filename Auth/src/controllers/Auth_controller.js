import mongoose from "mongoose";
import User from "../models/Auth_model.js";
import logger from "../utils/logger.js";
import "../helpers/env.js";
import Validation from "../utils/validation.js";
import TokenService from "../utils/generate_tokens.js";
import rabbitMQClient from "../utils/rabbit.js";
import VerificationCode from "../models/verificationCode_model.js";
import RefreshToken from "../models/RefreshToken_model.js";
import PasswordResetCode from "../models/Password_reset_model.js";


class AuthController {
    static async register(req, res, role) {
        logger.info("Registration Endpoint...")
        const session = await mongoose.startSession();
        session.startTransaction()
        try {
            const {error} = Validation.validateSignup(req.body);
            if (error) {
                logger.error("Validation Error: ", error.details[0].message);
                return res.status(400).json({ success: false, message: error.details[0].message });
            }
            const {firstName, lastName, email, password} = req.body;

            const existingUser = await User.findOne({ email }).session(session);
            if (existingUser){
                logger.warn("User already exists with email: ", email);
                return res.status(409).json({ success: false, message: "User already exists" });
            }
            const newUser = await User.create([{
                firstName,
                lastName,
                email,
                password, 
                role
            }], { session });
            if (!newUser) {
                logger.error("User creation failed");
                return res.status(500).json({ success: false, message: "User creation failed" });
            }
            const newCreatedUser = newUser[0];
            const OTP = await TokenService.generateVerificationOTP(newCreatedUser);
            console.log("OTP: ", OTP);
            
            await rabbitMQClient.publish('user.verification_code.created', {
                email: newCreatedUser.email,
                type: "VERIFICATION",
                payload: {
                    firstName: newCreatedUser.firstName,
                    lastName: newCreatedUser.lastName,
                    otp: OTP,
                    userId: newCreatedUser._id.toString(),
                    role
                }
            }, { persistent: true });

            await session.commitTransaction();
            return res.status(201).json({
                success: true,
                message: "User registered successfully. Verification email sent.",
                data: {
                    id: newUser[0]._id,
                    email: newUser[0].email,
                    role: newUser[0].role
                }
            });
        } catch (error) {
            await session.abortTransaction()
            logger.error("Error in registration: ", error.stack);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        } finally {
            await session.endSession();
        }
    }

    static async RegisterAdmin(req, res) {
        logger.info("Admin Registration Endpoint...");
        return AuthController.register(req, res, "admin");
    }

    static async RegisterVendor(req, res) {
        logger.info("Vendor Registration Endpoint...");
        return AuthController.register(req, res, "vendor");
    }
    static async RegisterCustomer(req, res) {
        logger.info("Customer Registration Endpoint...");
        return AuthController.register(req, res, "customer");
    }

    static async resendOTP(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            logger.warn(`Resend OTP attempted for non-existent email: ${email}`);
            return res.status(200).json({
                success: true,
                message: "If the email exists, a verification code has been resent.",
            });
        }
        const existingOTP = await VerificationCode.findOne({ user: user._id })
        .sort({ createdAt: -1 });

        if (existingOTP && Date.now() - new Date(existingOTP.createdAt).getTime() < 60000) {
            return res.status(429).json({
                success: false,
                message: "Please wait before requesting another code.",
            });
        }

        const OTP = await TokenService.generateVerificationOTP(user);

        await rabbitMQClient.publish('user.verification_code.resend', {
            email: user.email,
            type: "RESEND_OTP",
            payload: {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userId: user._id.toString(),
                role: user.role,
                otp: OTP,
            }
        }, { persistent: true });

        return res.status(200).json({ success: true, message: "Verification email resent successfully" });

        } catch (error) {
            logger.error("Error resending OTP: ", error.stack);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    static async verifyUser(req, res) {
        logger.info("User Verification Endpoint...");
        const session = await mongoose.startSession();
        session.startTransaction()
        try{
            const { code } = req.body;
            if (!code) {
                return res.status(400).json({ success: false, message: "Verification code is required" });
            }
            const verificationCode = await VerificationCode.findOne({
                code
            }).session(session);
            if (!verificationCode) {
                logger.warn("Invalid verification code: ", code);
                return res.status(400).json({ success: false, message: "Invalid verification code" });
            }
            if (!verificationCode.verified) {
                logger.info("Verification code already verified: ", code);
                return res.status(200).json({ success: true, message: "User already verified" });
            }

            if (verificationCode.expiresAt < new Date()) {
                logger.warn("Verification code expired: ", code);
                return res.status(400).json({ success: false, message: "Verification code expired" });
            }

            verificationCode.verified = true;
            await verificationCode.save({ session });
            const user = await User.findByIdAndUpdate(
                verificationCode.user,
                { isActive: true },
                { new: true, session }
            )
            if (!user) {
                logger.error("User not found for verification code: ", code);
                return res.status(404).json({ success: false, message: "User not found" });
            }

            await rabbitMQClient.publish('user.is_verified', {
                email: user.email,
                type: "WELCOME",
                payload: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    userId: user._id.toString(),
                    role: user.role
                }
            }, { persistent: true })

            await session.commitTransaction();
            return res.status(200).json({
                success: true,
                message: "User verified successfully",
                data: {
                    id: user._id,
                    email: user.email,
                    role: user.role
                }
            })
            
        }catch(error) {
            await session.abortTransaction();
            logger.error("Error in user verification: ", error.stack);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
        finally {
            await session.endSession();
            logger.info("User verification process completed.");
        }
    }

    static async loginUser(req, res) {
        logger.info("User Login Endpoint...");
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                logger.warn("Email and password are required for login");
                return res.status(400).json({ success: false, message: "Email and password are required" });
            }

            const user = await User.findOne({ email });
            if (!user) {
                logger.warn(`Login attempt for non-existent email: ${email}`);
                return res.status(401).json({ success: false, message: "Invalid email or password" });
            }
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                logger.warn(`Invalid password attempt for email: ${email}`);
                return res.status(401).json({ success: false, message: "Invalid email or password" });
            }
            if (!user.isActive) {
                const OTP = await TokenService.generateVerificationOTP(user);
                await rabbitMQClient.publish('user.verification_code.resend', {
                    email: user.email,
                    type: "RESEND_OTP",
                    payload: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        otp: OTP,
                        userId: user._id.toString(),
                        role: user.role
                    }
                }, { persistent: true });
                logger.warn(`Inactive user login attempt: ${email}`);
                return res.status(403).json({ success: false, message: "User is not active. A new verification code has been sent." });
            }

            const { accessToken, refreshToken } = await TokenService.generateTokens(user);
            logger.info(`User logged in successfully: ${user._id}`);
            return res.status(200).json({
                success: true,
                message: "User logged in successfully",
                data: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    accessToken,
                    refreshToken
                }
            })
        } catch (error) {
            logger.error("Error in user login: ", error.stack);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }


    static async logoutUser(req, res) {
        logger.info("User Logout Endpoint...");
        const session = await mongoose.startSession();
        session.startTransaction();
        try{
            const  { refreshToken } = req.body;
            if (!refreshToken) {
                logger.warn("Refresh token not found");
                return res.status(400).json({ success: false, message: "Refresh token not found" });
            }
            const storedToken = await RefreshToken.findOne({ token: refreshToken }).session(session);
            if (!storedToken) {
                logger.warn("Invalid refresh token");
                return res.status(401).json({ success: false, message: "Invalid refresh token" });
            }
            await RefreshToken.deleteOne({ _id: storedToken._id }).session(session);
            await session.commitTransaction();
            logger.info("User logout process completed.");
            return res.status(200).json({ success: true, message: "User logged out successfully" });
        }catch(error) {
            await session.abortTransaction();
            logger.error("Error in user logout: ", error.stack);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        } finally {
            await session.endSession();
        }
    }

    static async forgotPassword(req, res) {
        logger.info("Forgot Password Endpoint...");
        try {
            const { email } = req.body;
            if (!email) {
                logger.warn("Email is required for password reset");
                return res.status(400).json({ success: false, message: "Email is required" });
            }

            const user = await User.findOne({ email });
            if (!user) {
                logger.warn(`Password reset attempt for non-existent email: ${email}`);
                return res.status(404).json({ success: false, message: "User not found" });
            }

            const OTP = await TokenService.generateForgotPasswordOTP(user);
            await rabbitMQClient.publish('user.forgot_password_code.send', {
                email: user.email,
                type: "FORGOT_PASSWORD",
                payload: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    otp: OTP,
                    userId: user._id.toString(),
                    role: user.role
                }
            }, { persistent: true });

            logger.info(`Password reset OTP sent to email: ${email}`);
            return res.status(200).json({ success: true, message: "Password reset OTP sent successfully" });
        } catch (error) {
            logger.error("Error in forgot password: ", error.stack);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    static async resetPassword(req, res) {
        logger.info("Reset Password Endpoint...");
        const session = await mongoose.startSession()
        session.startTransaction();
        try{
            const { code, newPassword, confirmPassword } = req.body;
            if (!code || !newPassword || !confirmPassword) {
                logger.warn("Code, new password, and confirm password are required for password reset");
                return res.status(400).json({ success: false, message: "Code, new password, and confirm password are required" });
            }
            if (newPassword !== confirmPassword) {
                logger.warn("New password and confirm password do not match");
                return res.status(400).json({ success: false, message: "New password and confirm password do not match" });
            }
            
            const passwordReset = await PasswordResetCode.findOne({
                code
            }).session(session);
            if (!passwordReset) {
                logger.warn("Invalid password reset code: ", code);
                return res.status(400).json({ success: false, message: "Invalid password reset code" });
            }
            const user = await User.findById(passwordReset.user).session(session);
            if (passwordReset.used) {
                logger.warn("Password reset code already used: ", code);
                const OTP = await TokenService.generateForgotPasswordOTP(user);
                await rabbitMQClient.publish('user.forgot_password_code.send', {
                    email: user.email,
                    type: "FORGOT_PASSWORD",
                    payload: {
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        otp: OTP,
                        userId: user._id.toString(),
                        role: user.role
                    }
                }, { persistent: true })
                    return res.status(400).json({ success: false, message: "Password reset code already used. A new code has been sent to your email." });
                }
            if (passwordReset.expiresAt < new Date()) {
                logger.warn("Password reset code expired: ", code);
                return res.status(400).json({ success: false, message: "Password reset code expired" });
            }
            
            if (!user) {
                logger.error("User not found for password reset code");
                return res.status(404).json({ success: false, message: "User not found" });
            }
            user.password = newPassword;
            passwordReset.used = true;
            await user.save({ session });
            await passwordReset.save({ session });
            await rabbitMQClient.publish('user.password_reset', {
                email: user.email,
                type: "RESET_PASSWORD",
                payload: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    userId: user._id.toString(),
                    role: user.role
                }
            }, { persistent: true });
            await session.commitTransaction();
            logger.info("Password reset successfully for user: ", user._id);
            return res.status(200).json({ success: true, message: "Password reset successfully" });
        }catch(error){
            await session.abortTransaction();
            logger.error("Error in reset password: ", error.stack);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        } finally {
            await session.endSession();
            logger.info("Reset password process completed.");
        }
    }

}


export default AuthController;