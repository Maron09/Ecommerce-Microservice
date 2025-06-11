import "./helpers/env.js";
import helmet from "helmet";
import express from "express";
import corsConfig from "./config/CorsConfig.js";
import RateLimiter from "./middleware/Limit_endpoint.js";
import LoggerMiddleware from "./middleware/RequestLogger.js";
import logger from "./utils/logger.js";
import CreateProxy from "./config/Proxy.js";
import errorHandler from "./middleware/Error_handler.js";
import RateLimiterMiddleware from "./middleware/RedisRateLimiter.js";
import AuthMiddleware from "./middleware/Auth_middleware.js";



const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(LoggerMiddleware.requestLogger)
app.use(LoggerMiddleware.addTimeStamp);
app.use(corsConfig());
app.use(express.json());


app.use(RateLimiterMiddleware({
    keyPrefix: process.env.RATE_LIMIT_KEY_PREFIX || 'rate_limit',
    points: process.env.RATE_LIMIT_POINTS ? parseInt(process.env.RATE_LIMIT_POINTS) : 100,
    duration: process.env.RATE_LIMIT_DURATION ? parseInt(process.env.RATE_LIMIT_DURATION) : 15 * 60,
}))

app.use(RateLimiter.create({
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 100,
    timeWindow: process.env.RATE_LIMIT_TIME_WINDOW ? parseInt(process.env.RATE_LIMIT_TIME_WINDOW) : 15 * 60 * 1000,
    message: "Too many requests, please try again later.",
    statusCode: process.env.RATE_LIMIT_STATUS_CODE ? parseInt(process.env.RATE_LIMIT_STATUS_CODE) : 429,
}));

app.use((req, res, next) => {
    req.headers["x-forwarded-host"] = req.get("host");
    req.headers["x-forwarded-proto"] = req.protocol;
    next();
});


app.use(errorHandler)

app.listen(PORT, () => {
    logger.info(`🚀 API Gateway running on port: ${PORT}`);

    logger.info(`🚀 Redis Url: ${process.env.REDIS_URL}`);
})