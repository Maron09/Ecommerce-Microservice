import Inventory from "../models/inventory_models.js";
import withTransaction from "../helpers/transactions.js";
import logger from "../utils/logger.js";
import rabbitMQClient from "../utils/rabbit.js";

class InventoryEvents {
    static async onProductCreated(data) {
        if (!data?.productId || !data?.productName || !data?.vendorId || !data?.email || !data?.inventoryCode || data.stock === undefined) {
            logger.error("Invalid data received for product creation", data);
            throw new Error("Invalid data for product creation");
        }

        logger.info("Received product created event", data);
        return await withTransaction(async (session) => {
            const exist = await Inventory.findOne({ productId: data.productId }, null, { session });
            if (exist) {
                logger.info("Inventory already exists for this product, skipping", data);
                return;
            }
            logger.info("Creating new inventory record...");
            await Inventory.create([{
                productId: data.productId,
                vendorId: data.vendorId,
                businessName: data.businessName,
                productName: data.productName,
                email: data.email,
                inventoryCode: data.inventoryCode,
                stock: data.stock
            }], { session });

            logger.info("New inventory record created");
        });
    }

    static async onProductUpdated(data) {

        const { productId, updatedValues } = data;

        if (!productId || !updatedValues) {
            logger.warn("Invalid product.updated message received", { data });
            return;
        }
        logger.info("Received product updated event", data);
        return await withTransaction(async (session) => {
            const inventory = await Inventory.findOne({ productId }, null, { session });
            if (!inventory) {
                logger.warn("No inventory found for the given productId", { productId });
                return;
            }

            let hasChanges = false;
            for (const [key, value] of Object.entries(updatedValues)) {
                if (inventory[key] !== value) {
                    inventory[key] = value;
                    hasChanges = true;
                }
            }
            if (hasChanges) {
                await inventory.save({ session });
                    logger.info("Inventory updated successfully", { productId });
                }
        });
    }
}

export default InventoryEvents;