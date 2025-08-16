import { type } from "os";
import Inventory from "../models/inventory_models.js";
import logger from "./logger.js";
import rabbitMQClient from "./rabbit.js";
import _ from "lodash";


export async function checkLowStock() {
    try {
        logger.info("Running low stock check...");

        const lowStockProducts = await Inventory.find({
            stock: { $lte: 5 },
            lowStockAlertSent: false
        });

        if (!lowStockProducts.length) {
            logger.info("No new low stock products found");
            return;
        }

        // Group by vendor email
        const groupedByEmail = _.groupBy(lowStockProducts, "email");

        for (const [email, products] of Object.entries(groupedByEmail)) {
            const productSummaries = products.map(p => ({
                productName: p.productName,
                stock: p.stock,
                productId: p.productId,
                inventoryCode: p.inventoryCode
            }));

            try {
                logger.warn(`Low stock alert for ${email}: ${productSummaries.length} products`);

                await rabbitMQClient.publish("inventory.low_count", {
                    email,
                    type: "LOW_INVENTORY",
                    payload: {
                        businessName: products[0].businessName,
                        products: productSummaries
                    }
                    
                });

                // Mark each product as alerted
                for (const p of products) {
                    p.lowStockAlertSent = true;
                    await p.save();
                }

            } catch (err) {
                logger.error(`Failed to send low stock alert for ${email}`, {
                    error: err.stack || err.message
                });
            }
        }

        logger.info(`Low stock alerts published for ${lowStockProducts.length} products (grouped by vendor).`);

    } catch (error) {
        logger.error("Error checking low stock", { error: error.stack || error.message });
    }
}

export async function resetLowStockFlags() {
    const replenished = await Inventory.find({
        stock: { $gt: 5 },
        lowStockAlertSent: true
    });

    if (replenished.length) {
        await Inventory.updateMany(
            { _id: { $in: replenished.map(p => p._id) } },
            { $set: { lowStockAlertSent: false } }
        );
        logger.info(`Reset low stock flags for: ${replenished.map(p => p.productName).join(", ")}`);
    }
}

