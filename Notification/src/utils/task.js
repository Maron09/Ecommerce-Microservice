
import logger from "./logger.js";
import _ from "lodash";
import amqplib from "amqplib";


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
