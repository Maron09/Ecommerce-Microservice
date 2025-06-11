import cors from 'cors';
import "../helpers/env.js";
import logger from '../utils/logger.js';


const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'];

const corsConfig = () => {
    return cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                logger.warn(`CORS policy blocked request from origin: ${origin}`);
                callback(new Error('CORS policy does not allow access from this origin'), false);
            }
        },
        methods: process.env.CORS_METHODS ? process.env.CORS_HEADERS.split(',') : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: process.env.CORS_HEADERS ? process.env.CORS_HEADERS.split(',') : ['Content-Type', 'Authorization', 'Accept-Version'],
        exposedHeaders: process.env.EXPOSED_HEADERS ? process.env.EXPOSED_HEADERS.split(',') : ['X-Total-Count', 'Content-Range'],
        credentials: process.env.CREDENTIALS || true,
        maxAge: process.env.MAX_AGE || 600,
        optionsSuccessStatus: process.env.OPTIONS_SUCCESS_STATUS
    })
}

export default corsConfig