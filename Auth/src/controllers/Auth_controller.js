import mongoose from "mongoose";
import User from "../models/Auth_model.js";
import logger from "../utils/logger.js";
import "../helpers/env.js";
import Validation from "../utils/validation.js";
import TokenService from "../utils/generate_tokens.js";
import rabbitMQClient from "../utils/rabbit.js";


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
}


export default AuthController;