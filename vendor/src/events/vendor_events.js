import logger from "../utils/logger.js";
import mongoose from "mongoose";
import Customer from "../models/Vendor.js";


class CustomerEvents {
    static async onVendorCreated(data){
        if (data.role !== "vendor") {
            logger.warn("Received event for non-vendor role, skipping", data);
            return;
        }
        if (!data?.userId || !data?.firstName || !data?.lastName || !data?.email) {
            logger.error("Invalid data received for vendor creation", data);
            throw new Error("Invalid data for vendor creation");
        }
        logger.info("Received vendor created event", data);
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            logger.info("Processing vendor created event...");
            // Check if vendor already exists
            const existingVendor = await Vendor.findOne({ userId: data.userId }, null, { session });
            if (existingVendor) {
                logger.warn("Vendor already exists, skipping creation", existingVendor);
                await session.commitTransaction();
                return;
            }
            logger.info("Creating new vendor...");
            await Vendor.create([{
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