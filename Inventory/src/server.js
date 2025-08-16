import "./helpers/env.js";
import "./utils/cron.js"
import helmet from "helmet";
import express from "express";
import corsConfig from "./config/CorsConfig.js";
// import RateLimiter from "./middleware/Limit_endpoint.js";
import LoggerMiddleware from "./middleware/RequestLogger.js";
import logger from "./utils/logger.js";
import ConnectToDB from "./database/db.js";
import errorHandler from "./middleware/Error_handler.js";
// import RateLimiterMiddleware from "./middleware/RedisRateLimiter.js";
import rabbitMQClient from "./utils/rabbit.js";
import InventoryEvents from "./events/inventory_events.js";

const app = express();
const PORT = process.env.PORT || 4000;

ConnectToDB();

app.use(helmet());
app.use(LoggerMiddleware.requestLogger);
app.use(LoggerMiddleware.addTimeStamp);
app.use(corsConfig());
app.use(express.json());



app.use(errorHandler)

async function startServer() {
    try {
        await rabbitMQClient.connect(process.env.EVENTS, process.env.TOPIC, {durable: false})
        logger.info("RabbitMQ connected Successfully")

        await rabbitMQClient.consume('product.created', InventoryEvents.onProductCreated)

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error("Error starting server", error);
        process.exit(1);
    }
}

startServer();