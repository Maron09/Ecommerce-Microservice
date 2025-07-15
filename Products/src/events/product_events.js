import logger from "../utils/logger.js";
import ApprovedVendors from "../models/approved_vendors.js";
import withTransaction from "../helpers/transactions.js";



class ProductEvents {
    static async onVendorApproved(data) {
        if (!data?.userId || !data?.vendorId || !data?.businessName || !data?.email) {
            logger.error("Invalid data received for vendor approval", data);
            throw new Error("Invalid data for vendor approval");
        }

        logger.info("Received vendor approved event", data);
        return await withTransaction(async (session) => {
            const exist = await ApprovedVendors.findOne({ vendorId: data.vendorId }, null, { session });
            if (exist) {
                logger.info("Vendor already approved, skipping", data);
                return;
            }
            logger.info("Creating new approved vendor...");
            await ApprovedVendors.create([{
                userId: data.userId,
                vendorId: data.vendorId,
                businessName: data.businessName,
                email: data.email,
                isApproved: true
            }], { session });

            logger.info("New approved vendor created");
        })
    }
}

export default ProductEvents;