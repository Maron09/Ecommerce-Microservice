import logger from "../utils/logger.js";
import mongoose from "mongoose";
import withTransaction from "../helpers/transactions.js";
import Admin from "../models/admin.js";
import Users from "../models/users.js";
import Customers from "../models/customers.js";



class AdminEvents {
    static async onAdmincreated(data) {
        if (data.role !== "admin") {
            logger.warn("Received event for non-admin role, skipping", data);
            return;
        }

        if (!data?.userId || !data?.firstName || !data?.lastName || !data?.email) {
            logger.error("Invalid data received for admin creation", data);
            throw new Error("Invalid data for admin creation");
        }
        logger.info("Received admin created event", data);
        return await withTransaction(async (session) => {
            const exists = await Admin.findOne({ userId: data.userId }, null, { session });
            if (exists) return;

            await Admin.create([{
                userId: data.userId,
                firstName: data.firstName,
                lastName: data.lastName,
                fullName: `${data.firstName} ${data.lastName}`,
                email: data.email,
            }], { session });

            logger.info("[AdminEvents.onAdmincreated] Admin created");
        }, "onAdmincreated");
    }

    static async onUserCreated(data) {
        if (!data?.userId || !data?.firstName || !data?.lastName || !data?.email) {
            logger.error("Invalid data received for user creation", data);
            throw new Error("Invalid data for user creation");
        }
        logger.info("Received user created event", data);
        return await withTransaction(async (session) => {
            const exists = await Users.findOne({ userId: data.userId }, null, { session });
            if (exists) return;

            await Users.create([{
                userId: data.userId,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                role: data.role,
                isActive: data.isActive,
            }], { session });

            logger.info("[AdminEvents.onUserCreated] User created");
        }, "onUserCreated");
    }
    

    static async onUserIsVerified(data) {
        if (!data?.userId) {
            logger.error("Invalid data received in user verification event", data);
            throw new Error("Missing userId in event data");
        }

        logger.info("User is verified... updating admin's user table", data);

        return await withTransaction(async (session) => {
            const user = await Users.findOne({ userId: data.userId }, null, { session });

            if (!user) {
                logger.warn("User not found in admin DB for verification update", { userId: data.userId });
                return;
            }

            user.isActive = data.isActive;
            await user.save({ session });

            logger.info("User verification status updated in admin DB", {
                userId: data.userId,
                isActive: data.isActive
            });
        }, "onUserIsVerified");
    }

    static async onCustomerCreated(data) {
        if (!data?.userId || !data?.customerId || !data?.firstName || !data?.lastName || !data?.email){
            logger.error("Invalid data received for customer creation", data);
            throw new Error("Invalid data for customer creation");
        }

        logger.info("Received customer created event", data);
        return await withTransaction(async (session) => {
            const exist = await Customers.findOne({ userId: data.userId }, null, {session})
            if (exist) return

            await Customers.create([{
                userId: data.userId,
                customerId: data.customerId,
                firstName: data.firstName,
                lastName: data.lastName,
                fullName: `${data.firstName} ${data.lastName}`,
                email: data.email
            }], { session });

            logger.info("[AdminEvents.onCustomerCreated] User created")
        }, "onCustomerCreated")
    }

}

export default AdminEvents;