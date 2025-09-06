
import Inventory from "../models/inventory_models.js";
import logger from "./logger.js";
import rabbitMQClient from "./rabbit.js";
import _ from "lodash";
import amqplib from "amqplib";


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

export async function processPendingMessages(exchangeName, queueName, handler) {
    let connection, channel;
    try {
        connection = await amqplib.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        // 1. Assert the exchange (must match producer)
        await channel.assertExchange(exchangeName, "topic", { durable: false });

        // 2. Assert the queue
        await channel.assertQueue(queueName, { durable: true });

        // 3. Bind queue to exchange with routing key
        await channel.bindQueue(queueName, exchangeName, queueName);

        logger.info(`Checking for pending messages in queue: ${queueName}`);

        let msg;
        while ((msg = await channel.get(queueName, { noAck: false }))) {
            try {
                const content = JSON.parse(msg.content.toString());
                logger.info(`Processing pending message from ${queueName}`, content);
                await handler(content);
                channel.ack(msg);
            } catch (error) {
                logger.error("Error processing pending message", {
                    error: error.stack || error.message
                });
            }
        }

        logger.info(`Finished processing pending messages in ${queueName}`);
    } catch (error) {
        logger.error("Error processing pending messages", {
            error: error.stack || error.message
        });
    } finally {
        if (channel) await channel.close();
        if (connection) await connection.close();
    }
}
