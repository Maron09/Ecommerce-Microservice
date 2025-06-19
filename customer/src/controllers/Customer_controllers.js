import Customer from "../models/Customer.js";
import logger from "../utils/logger.js";
import mongoose from "mongoose";
import rabbitMQClient from "../utils/rabbit.js";


class CustomerControllers {
    static async customerProfile(req, res){
        logger.info("Fetching customer profile");
        try {
            const userId = req.user.userId;
            console.log("User ID from request", { userId });

            const customer = await Customer.findOne({ userId });
            if (!customer) {
                logger.warn("Customer not found", { userId });
                return res.status(404).json({ success: false, message: "Customer not found" });
            }

            logger.info("Customer profile fetched successfully", { userId });
            return res.status(200).json({ success: true, data: customer });
        } catch (error) {
            logger.error("Error fetching customer profile", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }

    static async updateCustomerProfile(req, res) {
        logger.info("Updating Customer profile");
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const userId = req.user.userId;
            const { firstName, lastName, email, phone } = req.body;

            const customer = await Customer.findOne({  userId }).session(session);
            if (!customer) {
                logger.warn("Customer not found for update", { userId });
                return res.status(404).json({ success: false, message: "Customer not found" });
            }
            const emailChanged = email && email !== customer.email;

            customer.firstName = firstName || customer.firstName;
            customer.lastName = lastName || customer.lastName;
            customer.email = email || customer.email;
            customer.phone = phone || customer.phone;
            customer.fullName = `${customer.firstName} ${customer.lastName}`;
            await customer.save({ session });
            await session.commitTransaction();
            logger.info("Customer profile updated successfully", { userId });
            await rabbitMQClient.publish("user.profile.updates", {
                userId,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
            })
            const responseMessage = emailChanged
                ? "Profile updated successfully, email change requires verification. check your inbox."
                : "Customer profile updated successfully";

            return res.status(200).json({ success: true, message: responseMessage, data: customer });

        }catch (error) {
            logger.error("Error updating customer profile", error);
            await session.abortTransaction();
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        } finally {
            session.endSession();
        }
    }
}

export default CustomerControllers;