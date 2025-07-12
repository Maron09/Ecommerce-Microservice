import logger from "../utils/logger.js";
import Vendor from "../models/Vendor.js";
import rabbitMQClient from "../utils/rabbit.js";
import withTransaction from "../helpers/transactions.js";


class VendorEvents {
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
        return await withTransaction(async (session) => {
            const exist = await Vendor.findOne({ userId: data.userId }, null, { session })
            if (exist) return

            logger.info("Creating new vendor...");
            const [newVendor] = await Vendor.create([{
                userId: data.userId,
                firstName: data.firstName,
                lastName: data.lastName,
                fullName: `${data.firstName} ${data.lastName}`,
                email: data.email,
            }], { session })

            await rabbitMQClient.publish('vendor.created', {
                vendorId: newVendor._id.toString(),
                userId: newVendor.userId,
                firstName: newVendor.firstName,
                lastName: newVendor.lastName,
                email: newVendor.email,
                isApproved: newVendor.isApproved
            })
        })
    }

    static async onVendorIsApproved(data) {
        if (!data?.vendorId || !data?.businessName || !data?.email) {
            logger.error("Invalid data received for vendor approval", data);
            throw new Error("Invalid data for vendor approval");
        }

        logger.info("Received vendor approval event", data)
        return await withTransaction(async (session) => {
            const vendor = await Vendor.findOne({_id: data.vendorId}).session(session)

            if (!vendor) {
                logger.error("Vendor not found", { vendorId: data.vendorId });
                new Error("Vendor not found");
            }

            if (vendor.isApproved) {
                logger.info("Vendor is already approved", { vendorId: data.vendorId });
                return;
            }

            vendor.isApproved = true
            await vendor.save({session})

            logger.info("Vendor marked as approved", { vendorId: data.vendorId });
        })
    }
}


export default VendorEvents;