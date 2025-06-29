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


app.use((req, res, next) => {
    const ip =req.ip
    if (ip === '::1' || ip === 'localhost' || ip === '::ffff:127.0.0.1') {
        return next()
    }
    return RateLimiterMiddleware({
        keyPrefix: process.env.RATE_LIMIT_KEY_PREFIX || 'rate_limit',
        points: process.env.RATE_LIMIT_POINTS ? parseInt(process.env.RATE_LIMIT_POINTS) : 1000,
        duration: process.env.RATE_LIMIT_DURATION ? parseInt(process.env.RATE_LIMIT_DURATION) : 60,
    })(req, res, next)
})

app.use(RateLimiter.create({
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 1000,
    timeWindow: process.env.RATE_LIMIT_TIME_WINDOW ? parseInt(process.env.RATE_LIMIT_TIME_WINDOW) : 60 * 1000,
    message: "Too many requests, please try again later.",
    statusCode: process.env.RATE_LIMIT_STATUS_CODE ? parseInt(process.env.RATE_LIMIT_STATUS_CODE) : 429,
}));

app.use((req, res, next) => {
    req.headers["x-forwarded-host"] = req.get("host");
    req.headers["x-forwarded-proto"] = req.protocol;
    next();
});

app.use("/v1/auth", CreateProxy(process.env.AUTH_SERVICE_URL, "Auth Service"))

app.use("/v1/customer", AuthMiddleware.ValidateToken, CreateProxy(process.env.CUSTOMER_SERVICE_URL, "Customer Service"))

app.use("/v1/admin", AuthMiddleware.ValidateToken, CreateProxy(process.env.ADMIN_SERVICE, "Admin Service"))


app.use(errorHandler)

app.listen(PORT, () => {
    logger.info(`🚀 API Gateway running on port: ${PORT}`);
    logger.info(`🚀 Auth Service is running on URL: ${process.env.AUTH_SERVICE_URL}`)
    logger.info(`🚀 Customer Service is running on URL: ${process.env.CUSTOMER_SERVICE_URL}`);
    logger.info(`🚀 Admin Service is running on URL: ${process.env.ADMIN_SERVICE}`);
    logger.info(`🚀 Redis Url: ${process.env.REDIS_URL}`);
})