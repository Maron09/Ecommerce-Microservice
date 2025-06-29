import amqplib from 'amqplib';
import logger from './logger.js';
import '../helpers/env.js';

class RabbitMQClient {
    constructor(url = process.env.RABBITMQ_URL || 'amqp://localhost') {
        this.url = url;
        this.connection = null;
        this.channel = null;
        this.exchangeName = null;
    }

    async connect(exchangeName = 'default_exchange', type = 'topic', options = {durable: false}) {
        try {
            this.connection = await amqplib.connect(this.url)
            this.channel = await this.connection.createChannel();
            this.exchangeName = exchangeName;

            await this.channel.assertExchange(this.exchangeName, type, options);

            await this.channel.assertExchange('dead_letter_exchange', 'topic', { durable: true });
            await this.channel.assertQueue('dead_letter_queue', { durable: true })
            await this.channel.bindQueue('dead_letter_queue', 'dead_letter_exchange', 'dead_letter');

            await this.channel.assertExchange('retry_exchange', 'direct', { durable: true });

            await this.channel.assertQueue('retry_queue_v2', {
                durable: true,
                messageTtl: 10000,
                deadLetterExchange: this.exchangeName,
                deadLetterRoutingKey: 'retry_target'
            });
            await this.channel.bindQueue('retry_queue_v2', 'retry_exchange', 'retry');


            // await this.channel.bindQueue('retry_queue', 'retry_exchange', 'retry');


            logger.info(`Connected to RabbitMQ and exchange '${this.exchangeName}' created successfully`);
            // return this.channel;
            this.#setupGracefulShutdown();
        } catch (error) {
            logger.error('Error connecting to RabbitMQ:', error);
            throw error;
        }
    }

    getChannel() {
        if (!this.channel) {
            throw new Error('RabbitMQ channel is not initialized. Please call connect() first.');
        }
        return this.channel;
    }

    async publish(routingKey, message, options = { persistent: true }) {
        try{
            if (!routingKey || typeof message === 'undefined') {
                throw new Error('Routing key and message are required to publish a message');
            }
            if(!this.channel){
                await this.connect(this.exchangeName);
            }
            const payload = Buffer.from(JSON.stringify(message));
            const success = this.channel.publish(this.exchangeName, routingKey, payload, options);
            if (!success) {
                logger.warn('Message not immediately written to buffer, channel is full.');
            }
            
            logger.info(`Message published to RabbitMQ exchange '${this.exchangeName}' with routing key '${routingKey}'`);
            if (process.env.NODE_ENV !== 'production') {
                logger.debug(`Message payload: ${JSON.stringify(message)}`);
            }

            return success;
        } catch (error) {
            logger.error('Error publishing message to RabbitMQ:', error);
            throw error;
        }
    }

    async consume(routingKey, callback, queueName = '', options = { exclusive: false, useDLQ: true, retry: true, maxRetries: 3 }) {
    try {
        if (!this.channel) {
            await this.connect(this.exchangeName);
        }

        const queueOptions = {
            durable: true,
            exclusive: options.exclusive || false,
        };

        if (options.useDLQ) {
            queueOptions['x-dead-letter-exchange'] = 'dead_letter_exchange';
            queueOptions['x-dead-letter-routing-key'] = 'dead_letter';
        }

        const q = await this.channel.assertQueue(queueName, queueOptions);
        await this.channel.bindQueue(q.queue, this.exchangeName, routingKey);

        logger.info(`Waiting for messages in queue '${q.queue}' with routing key '${routingKey}'`);

        this.channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                try {
                    const messageContent = JSON.parse(msg.content.toString());
                    logger.info(`Received message: ${JSON.stringify(messageContent)}`);
                    await callback(messageContent);
                    this.channel.ack(msg);
                } catch (error) {
                    logger.error('Error processing message:', error);
                    
                    const headers = msg.properties.headers || {};
                    const retryCount = headers['x-retry-count'] || 0;

                    if (options.retry && retryCount < options.maxRetries) {
                        logger.warn(`Retrying message (${retryCount + 1}/${options.maxRetries})`);
                        this.channel.publish(
                            'retry_exchange',
                            'retry',
                            msg.content,
                            {
                                headers: { 'x-retry-count': retryCount + 1 },
                                persistent: true
                            }
                        );
                    } else {
                        logger.error('Max retries reached. Sending to DLQ.');
                        this.channel.nack(msg, false, false); // DLQ
                    }

                    this.channel.ack(msg); // always ack original so it's not stuck
                }
            }
        }, { noAck: false });

        logger.info(`Consumer is set up for routing key '${routingKey}'`);
    } catch (error) {
        logger.error('Error consuming message from RabbitMQ:', error);
        throw error;
    }
}


    async consumeDLQ(callback, routingKey = 'dead_letter', queueName = 'dead_letter_queue') {
        try {
            if (!this.channel) {
                await this.connect(this.exchangeName);
            }

            const q = await this.channel.assertQueue(queueName, { durable: true });
            await this.channel.bindQueue(q.queue, 'dead_letter_exchange', routingKey);

            this.channel.consume(q.queue, async (msg) => {
                if (msg !== null) {
                    try {
                        const messageContent = JSON.parse(msg.content.toString());
                        logger.warn(`💀 Dead Letter Message: ${JSON.stringify(messageContent)}`);
                        await callback(messageContent);
                        this.channel.ack(msg);
                    } catch (err) {
                        logger.error('Failed to handle DLQ message:', err);
                        this.channel.nack(msg, false, false);
                    }
                }
            }, { noAck: false });

            logger.info(`DLQ consumer set up on '${queueName}'`);
        } catch (err) {
            logger.error('Error consuming DLQ:', err);
        }
    }

    
    async close() {
        try {
            if (this.channel) await this.channel.close();
            if (this.connection) await this.connection.close();
            logger.info('RabbitMQ connection closed successfully');
        } catch (error) {
            logger.error('Error closing RabbitMQ connection:', error);
        }
    }

    #setupGracefulShutdown() {
        process.on('SIGINT', async () => {
            logger.info('SIGINT received, closing RabbitMQ connection...');
            await this.close();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            logger.info('SIGTERM received, closing RabbitMQ connection...');
            await this.close();
            process.exit(0);
        });
    }

}


export default RabbitMQClient;