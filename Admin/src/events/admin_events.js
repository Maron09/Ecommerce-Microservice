import logger from "../utils/logger.js";
import mongoose from "mongoose";
import withTransaction from "../helpers/transactions.js";
import Admin from "../models/admin.js";
import Users from "../models/users.js";
import Customers from "../models/customers.js";
import Vendors from "../models/vendors.js";
import SubAccounts from "../models/subaccounts.js";




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

            if (typeof data.isActive === "boolean") {
                user.isActive = data.isActive;
            }
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

    static async onVendorCreated(data) {
        if (!data?.userId || !data?.vendorId || !data?.firstName || !data?.lastName || !data?.email) {
            logger.error("Invalid data received for customer creation", data);
            throw new Error("Invalid data for customer creation");
        }

        logger.info("Received vendor created event", data)
        return await withTransaction(async (session) => {
            const exist = await Vendors.findOne({userId: data.userId}, null, {session})

            if (exist) return

            await Vendors.create([{
                userId: data.userId,
                vendorId: data.vendorId,
                firstName: data.firstName,
                lastName: data.lastName,
                fullName: `${data.firstName} ${data.lastName}`,
                email: data.email,
                isApproved: data.isApproved
            }], {session})

            logger.info("[AdminEvents.onVendorCreated]User Created")
        }, "onVendorCreated")
    }

    static async onCompleteVendorProfile(data) {
        if (!data?.userId || !data?.businessName || !data?.phone){
            logger.error("Invalid data received for vendor KYC", data);
            throw new Error("Invalid data for vendor KYC");
        }

        logger.info("Received vendor KYC event", data)
        return await withTransaction(async (session) => {
            const vendor = await Vendors.findOne({ userId: data.userId }, null, { session })
            if (!vendor) {
                logger.warn(`Vendor not found for userId: ${data.userId}`);
                return
            }

            vendor.businessName = data.businessName
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(" ");
            vendor.phone = data.phone

            await vendor.save({ session })
            
            logger.info(`✅ Vendor profile updated for userId: ${data.userId}`);
        })
    }

    static async onSubAccountCreated(data) {
        if (!data?.userId || !data?.vendorId || !data?.bankName || !data?.bankCode || !data?.subaccountCode) {
            logger.error("Invalid data received for subaccount", data);
            throw new Error("Invalid data for subaccount");
        }

        logger.info("Received Subaccount event", data)
        return await withTransaction(async (session) => {
            const existing = await SubAccounts.findOne({
                userId: data.userId,
                vendorId: data.vendorId,
                bankCode: data.bankCode
            }).session(session)

            if (existing) {
                logger.info("Updating existing vendor bank account with subaccount code", {
                    vendorId: data.vendorId,
                    bankCode: data.bankCode
                })
                existing.subaccountCode = data.subaccountCode
                existing.isVerified = true
                await existing.save({session})
                return existing
            }

            logger.info("Creating new vendor bank account with subaccount code", {
                vendorId: data.vendorId,
                bankCode: data.bankCode
            });

            const newBank = await SubAccounts.create([{
                userId: data.userId,
                vendorId: data.vendorId,
                bankName: data.bankName,
                bankCode: data.bankCode,
                subaccountCode: data.subaccountCode,
                isVerified: true
            }], {session})

            return newBank[0]
        })
    }

    static async onCustomerUpdated(data) {}

    static async onVendorUpdated(data) {}

    static async onUserUpdated(data) {}

}

export default AdminEvents;