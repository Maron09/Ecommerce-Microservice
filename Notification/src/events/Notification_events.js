import mongoose from "mongoose";
import logger from "../utils/logger.js";
import Notification from "../models/Notification_model.js";
import sendEmail from "../helpers/mail.js";

const handleVerification = async (data) => {
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
        await sendEmail(
            email,
            "Your Verification Code",
            `<p>Your verification code is <strong>${otpcode}</strong>.</p>`
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

export default handleVerification