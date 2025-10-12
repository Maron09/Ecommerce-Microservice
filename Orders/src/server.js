import "./helpers/env.js";
import helmet from "helmet";
import "./utils/cron.js"
import express from "express";
import corsConfig from "./config/CorsConfig.js";
import RateLimiter from "./middleware/Limit_endpoint.js";
import LoggerMiddleware from "./middleware/RequestLogger.js";
import logger from "./utils/logger.js";
import ConnectToDB from "./database/db.js";
import errorHandler from "./middleware/Error_handler.js";
import RateLimiterMiddleware from "./middleware/RedisRateLimiter.js";
import rabbitMQClient from "./utils/rabbit.js";
import OrderEvents from "./events/order_event.js";
import router from "./routes/order_routes.js";

const app = express();
const PORT = process.env.PORT || 3010;

ConnectToDB()

app.use(helmet());
app.use(LoggerMiddleware.requestLogger)
app.use(LoggerMiddleware.addTimeStamp)
app.use(corsConfig());
app.use(express.json());


app.use((req, res, next) => {
    const ip = req.ip;

    const localIPs = ['::1', '127.0.0.1', '::ffff:127.0.0.1', 'localhost'];

    if (localIPs.includes(ip)) {
        return next();
    }

    return RateLimiterMiddleware({
        keyPrefix: process.env.RATE_LIMIT_KEY_PREFIX || 'rate_limit',
        points: parseInt(process.env.RATE_LIMIT_POINTS || '100'),
        duration: parseInt(process.env.RATE_LIMIT_DURATION || '60'),
    })(req, res, next);
});

app.set('trust proxy', true);

app.use(RateLimiter.create({
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 1000,
    timeWindow: process.env.RATE_LIMIT_TIME_WINDOW ? parseInt(process.env.RATE_LIMIT_TIME_WINDOW) : 1 * 60 * 1000,
    message: "Too many requests, please try again later.",
    statusCode: process.env.RATE_LIMIT_STATUS_CODE ? parseInt(process.env.RATE_LIMIT_STATUS_CODE) : 429,
}));

app.use("/api/order", router)

app.use(errorHandler);
async function startServer() {
    try {
        await rabbitMQClient.connect(process.env.EVENTS, process.env.TOPIC, {durable: false})
        logger.info("RabbitMQ connected Successfully")

        await rabbitMQClient.consume('order.placed', OrderEvents.onOrderCreated)

        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error("Error starting server", error);
        process.exit(1);
    }
}
startServer();