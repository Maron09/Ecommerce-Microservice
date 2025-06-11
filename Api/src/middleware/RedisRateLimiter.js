import { RateLimiterRedis } from "rate-limiter-flexible";
import RedisClient from "../config/RedisClient.js";
import logger from "../utils/logger.js";


const CreateRateLimiter = ({keyPrefix, points, duration, blockDuration = 10}) => {
    return new RateLimiterRedis({
        storeClient: RedisClient,
        keyPrefix: keyPrefix,
        points: points, // Number of points
        duration: duration, // Per duration in seconds
        blockDuration: blockDuration, // Block for this many seconds if consumed points exceeds
    })
}


const RateLimiterMiddleware = (options) => {
    const limiter = CreateRateLimiter(options);

    return async (req, res, next) => {
        try {
        const key = req.ip; // Use IP address as the key for rate limiting
        const rateLimit = await limiter.consume(key);
        res.set('X-RateLimit-Limit', rateLimit.limiter.points);
        res.set('X-RateLimit-Remaining', rateLimit.remainingPoints);
        res.set('X-RateLimit-Reset', rateLimit.msBeforeNext / 1000); // Time until reset in seconds
        next();
    } catch {
        logger.warn(`Rate limit exceeded for ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
            res.status(429).json({
                success: false,
                message: "Too many requests, please try again later."
            });
        }
    }
}


export default RateLimiterMiddleware;