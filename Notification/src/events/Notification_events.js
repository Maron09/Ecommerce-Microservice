import mongoose from "mongoose";
import logger from "../utils/logger.js";
import Notification from "../models/Notification_model.js";
import sendNotificationEmail from "../helpers/sendNotificationEmail.js";



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
            await sendNotificationEmail({
                email: data.email,
                type: "VERIFICATION",
                payload: data.payload
            })
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
            await sendNotificationEmail({
                email: data.email,
                type: "RESEND_OTP",
                payload: data.payload
            })
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
            await sendNotificationEmail({
                email: data.email,
                type: "WELCOME",
                payload: data.payload
            })
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
            await sendNotificationEmail({
                email: data.email,
                type: "FORGOT_PASSWORD",
                payload: data.payload
            })
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
            await sendNotificationEmail({
                email: data.email,
                type: "RESET_PASSWORD",
                payload: data.payload
            })
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
            await sendNotificationEmail({
                email: data.email,
                type: "VERIFICATION",
                payload: data.payload
            })
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

    static async handleVendorApproved(data) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const notification = await Notification.create([{
                email: data.email,
                type: data.type,
                payload: data.payload,
                status: "PENDING"
            }], { session });

            await sendNotificationEmail({
                email: data.email,
                type: "APPROVED",
                payload: data.payload
            });

            // Update the status in the same session
            await Notification.updateOne(
                { _id: notification[0]._id },
                { $set: { status: "SENT" } },
                { session }
            );

            await session.commitTransaction();

            logger.info("Vendor approval email sent successfully to:", data.email);
        } catch (error) {
            await session.abortTransaction();
            logger.error("Error sending vendor approval email:", error.stack);
            throw error;
        } finally {
            await session.endSession();
        }
    }

}

export default NotificationEvents