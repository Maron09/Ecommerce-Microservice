import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import { RedisStore } from "rate-limit-redis"
import RedisClient from '../config/RedisClient.js';


class RateLimiter {
    static create({
        maxRequests,
        timeWindow,
        message = "Too many requests, please try again later.",
        statusCode,
    }) {
        return rateLimit({
            store: new RedisStore({
                sendCommand: (...args) => RedisClient.call(...args),
            }),
            windowMs: timeWindow,
            max: maxRequests,
            standardHeaders: true, 
            legacyHeaders: false,
            handler: (req, res) => {
                logger.warn(`Rate limit exceeded for ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
                res.status(statusCode).json({
                    success: false,
                    message: message
                });
            }
        })
    }
}

export default RateLimiter;