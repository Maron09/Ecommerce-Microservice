import logger from "../utils/logger.js";
import ApprovedVendors from "../models/approved_vendors.js";
import withTransaction from "../helpers/transactions.js";
import rabbitMQClient from "../utils/rabbit.js";
import Product from "../models/product.js";



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

    static async onOrderPlaced(data) {
        if (!data?.items || !Array.isArray(data.items) || data.items.length === 0) {
            logger.error("Invalid data received for order placed", data);
            throw new Error("Invalid data for order placed");
        }

        logger.info("Received order placed event", {
            itemCount: data.items.length
        });

        return await withTransaction(async (session) => {
            const productIds = data.items.map(item => item.productId);
            const products = await Product.find({ _id: { $in: productIds } }, null, { session });
            if (!products.length) {
                logger.error("No products found for the given product IDs", { productIds });
                return;
            }
            const vendorIds = [...new Set(products.map(p => p.vendorId.toString()))];

            const vendors = await ApprovedVendors.find({ vendorId: { $in: vendorIds } })
                .select("vendorId email businessName")
                .session(session);

            if (!vendors.length) {
                logger.error("No approved vendors found for the given vendor IDs", { vendorIds });
                return;
            }

            const vendorMap = {};
            for (const vendor of vendors) {
                const vendorProducts = products.filter(p => p.vendorId && vendor.vendorId && p.vendorId.toString() === vendor.vendorId.toString())
                const vendorItems = data.items.filter(item =>
                    vendorProducts.some(p => p._id.toString() === item.productId.toString())
                )

                vendorMap[vendor.email] = {
                    businessName: vendor.businessName,
                    items: vendorItems
                };
            }
            for (const [vendorEmail, vendorData] of Object.entries(vendorMap)) {
                const total = vendorData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                await rabbitMQClient.publish("order.vendor.notify", {
                    type: "ORDER_VENDOR_NOTIFICATION",
                    email: vendorEmail,
                    payload: {
                        businessName: vendorData.businessName,
                        vitems: vendorData.items,
                        total,
                    }
                })
                logger.info("Vendor mapping debug", { vendorEmail, vendorData });
                logger.info("Published order notification for vendor", {
                    vendorEmail,
                    itemCount: vendorData.items.length
                });
            }
            logger.info("All vendor notifications published for order");
        });

    }
}

export default ProductEvents;