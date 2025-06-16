import logger from "../utils/logger.js";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";


class CustomerEvents {
    static async onCustomerCreated(data){
        if (data.role !== "customer") {
            logger.warn("Received event for non-customer role, skipping", data);
            return;
        }
        if (!data?.userId || !data?.firstName || !data?.lastName || !data?.email) {
            logger.error("Invalid data received for customer creation", data);
            throw new Error("Invalid data for customer creation");
        }
        logger.info("Received customer created event", data);
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            logger.info("Processing customer created event...");
            // Check if customer already exists
            const existingCustomer = await Customer.findOne({ userId: data.userId }, null, { session });
            if (existingCustomer) {
                logger.warn("Customer already exists, skipping creation", existingCustomer);
                await session.commitTransaction();
                return;
            }
            logger.info("Creating new customer...");
            await Customer.create([{
                userId: data.userId,
                firstName: data.firstName,
                lastName: data.lastName,
                fullName: `${data.firstName} ${data.lastName}`,
                email: data.email,
            }], { session });
            logger.info("Customer created successfully");
            await session.commitTransaction();
        }catch (error) {
            await session.abortTransaction();
            logger.error("Error processing customer created event", error);
            throw error;
        }finally {
            session.endSession();
        }
    }
}


export default CustomerEvents;