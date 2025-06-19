import mongoose from "mongoose";
import logger from "../utils/logger.js";
import Notification from "../models/Notification_model.js";
import sendEmail from "../helpers/mail.js";



class NotificationEvents {
    static async handleVerification(data) {
        const session = await mongoose.startSession()
        session.startTransaction()
        try{
            const notification = await Notification.create({
                email: data.email,
                type: data.type,
                payload: data.payload
            })
            const { email, payload } = data;
            const otpcode = payload?.OTP || payload.otp || payload.otpCode || "000000";
            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${payload.firstName},</h2>
                    <p style="font-size: 16px; color: #555;">
                    Thank you for registering. Your verification code is:
                    </p>
                    <div style="font-size: 32px; font-weight: bold; color: #000; text-align: center; margin: 20px 0;">
                    ${otpcode}
                    </div>
                    <p style="font-size: 14px; color: #888;">
                    This code will expire in 15 minutes. If you did not request this, please ignore this email.
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            await sendEmail(
                email,
                "Your Verification Code",
                html
            )
            notification.status = "SENT"
            await session.commitTransaction()
            logger.info("Verification email sent successfully to:", email)
            await notification.save()
        } catch(error) {
            await session.abortTransaction()
            logger.error("Error sending verification email:", error.stack)
            throw error
        }finally{
            await session.endSession()
            logger.info("Verification email sent successfully")
        }
    }

    static async handleResendOTP(data) {
        const session = await mongoose.startSession()
        session.startTransaction()
        try{
            const notification = await Notification.create({
                email: data.email,
                type: data.type,
                payload: data.payload
            })
            const { email, payload } = data;
            const otpcode = payload?.OTP || payload.otp || payload.otpCode || "000000";
            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${payload.firstName},</h2>
                    <p style="font-size: 16px; color: #555;">
                    Your OTP has been resent. Your verification code is:
                    </p>
                    <div style="font-size: 32px; font-weight: bold; color: #000; text-align: center; margin: 20px 0;">
                    ${otpcode}
                    </div>
                    <p style="font-size: 14px; color: #888;">
                    This code will expire in 15 minutes. If you did not request this, please ignore this email.
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            await sendEmail(
                email,
                "Your Resent Verification Code",
                html
            )
            notification.status = "SENT"
            await session.commitTransaction()
            logger.info("Resend OTP email sent successfully to:", email)
            await notification.save()
        } catch(error) {
            await session.abortTransaction()
            logger.error("Error sending resend OTP email:", error.stack)
            throw error
        }finally{
            await session.endSession()
            logger.info("Resend OTP email sent successfully")
        }
    }

    static async handleVerifyuser(data) {
        const session = await mongoose.startSession()
        session.startTransaction()
        try{
            const notification = await Notification.create({
                email: data.email,
                type: data.type,
                payload: data.payload
            })
            const { email, payload } = data;
            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${payload.firstName},</h2>
                    <p style="font-size: 16px; color: #555;">
                    Your account has been successfully verified. Welcome aboard!
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            await sendEmail(
                email,
                "Account Verification Successful",
                html
            )
            notification.status = "SENT"
            await session.commitTransaction()
            await notification.save()
        } catch(error) {
            await session.abortTransaction()
            logger.error("Error sending account verification email:", error.stack)
            throw error
        }finally{
            await session.endSession()
            logger.info("Account verification email sent successfully")
        }
    }

    static async handleForgotPassword(data) {
        const session = await mongoose.startSession()
        session.startTransaction()
        try{
            const notification = await Notification.create({
                email: data.email,
                type: data.type,
                payload: data.payload
            })
            const { email, payload } = data;
            const otpcode = payload?.OTP || payload.otp || payload.otpCode || "000000";
            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${payload.firstName},</h2>
                    <p style="font-size: 16px; color: #555;">
                    You requested a password reset. Your verification code is:
                    </p>
                    <div style="font-size: 32px; font-weight: bold; color: #000; text-align: center; margin: 20px 0;">
                    ${otpcode}
                    </div>
                    <p style="font-size: 14px; color: #888;">
                    This code will expire in 15 minutes. If you did not request this, please ignore this email.
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            await sendEmail(
                email,
                "Your Password Reset Code",
                html
            )
            notification.status = "SENT"
            await session.commitTransaction()
            await notification.save()
        } catch(error) {
            await session.abortTransaction()
            logger.error("Error sending password reset email:", error.stack)
            throw error
        }finally{
            await session.endSession()
            logger.info("Password reset email sent successfully")
        }
    }

    static async handleResetPassword(data) {
        const session = await mongoose.startSession()
        session.startTransaction()
        try{
            const notification = await Notification.create({
                email: data.email,
                type: data.type,
                payload: data.payload
            })
            const { email, payload } = data;
            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${payload.firstName},</h2>
                    <p style="font-size: 16px; color: #555;">
                    Your password has been successfully reset. If you did not request this change, please contact support.
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            await sendEmail(
                email,
                "Password Reset Successful",
                html
            )
            notification.status = "SENT"
            await session.commitTransaction()
            await notification.save()
        } catch(error) {
            await session.abortTransaction()
            logger.error("Error sending password reset email:", error.stack)
            throw error
        }finally{
            await session.endSession()
            logger.info("Password reset email sent successfully")
        }
    }

    static async handleProfileUpdate(data) {
        const session = await mongoose.startSession()
        session.startTransaction()
        try{
            const notification = await Notification.create({
                email: data.email,
                type: data.type,
                payload: data.payload
            })
            const { email, payload } = data;
            const otpcode = payload?.OTP || payload.otp || payload.otpCode || "000000";
            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${payload.firstName},</h2>
                    <p style="font-size: 16px; color: #555;">
                    Your Email has been Updated. Your verification code is:
                    </p>
                    <div style="font-size: 32px; font-weight: bold; color: #000; text-align: center; margin: 20px 0;">
                    ${otpcode}
                    </div>
                    <p style="font-size: 14px; color: #888;">
                    This code will expire in 15 minutes. If you did not request this, please ignore this email.
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            await sendEmail(
                email,
                "Email Change Verification Code",
                html
            )
            notification.status = "SENT"
            await session.commitTransaction()
            logger.info("Verification email sent successfully to:", email)
            await notification.save()
        } catch(error) {
            await session.abortTransaction()
            logger.error("Error sending verification email:", error.stack)
            throw error
        }finally{
            await session.endSession()
            logger.info("Verification email sent successfully")
        }
    }
}

export default NotificationEvents