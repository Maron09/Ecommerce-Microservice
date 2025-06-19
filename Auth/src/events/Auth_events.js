import logger from "../utils/logger.js";
import mongoose from "mongoose";
import User from "../models/Auth_model.js";
import rabbitMQClient from "../utils/rabbit.js";
import TokenService from "../utils/generate_tokens.js";


class AuthEvents {
    static async onProfileChange(data) {
        if (!data?.email) {
            logger.info("No email change data provided, skipping event processing");
            return;
        }
        logger.info("Received profile update event", data)
        const session = await mongoose.startSession();
        session.startTransaction();
        try{
            logger.info("Processing profile change event...")
            const userId = data.userId;
            const user = await User.findOne({ _id: userId }).session(session);
            if (!user) {
                logger.warn("User not found for profile update", { userId });
                await session.abortTransaction();
                return;
            }

            let emailChanged = false;
            let OTP = null;
            if (data.email && data.email !== user.email) {
                emailChanged = true;
                logger.info("Email change detected", { oldEmail: user.email, newEmail: data.email });
                OTP = await TokenService.generateVerificationOTP(user);
                user.email = data.email;
                user.isActive = false;
            }
            user.firstName = data.firstName || user.firstName;
            user.lastName = data.lastName || user.lastName;
            await user.save({ session });
            await session.commitTransaction();
            logger.info("User profile updated successfully", { userId });
            if (emailChanged) {
                logger.info("Publishing email change event to RabbitMQ", { userId, newEmail: data.email });
                await rabbitMQClient.publish("user.profile.updated", {
                    email: user.email,
                    type: "VERIFICATION",
                    payload: {
                        userId: user._id.toString(),
                        firstName: user.firstName,
                        lastName: user.lastName,
                        otp: OTP,
                    }
                })
                logger.info("Email changed, verification OTP sent");
            }
        } catch (error) {
            await session.abortTransaction();
            logger.error("Error processing profile change event", error);
            throw error;
        }
        finally {
            await session.endSession();
        }
    }
}


export default AuthEvents;