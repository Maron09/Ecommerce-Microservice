import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import "../helpers/env.js"


const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const transports = []

const fileTransports = [
    new DailyRotateFile({
        filename: `${logDir}/%DATE%-combined.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'info'
    }),
    new DailyRotateFile({
        filename: `${logDir}/%DATE%-error.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
        level: 'error'
    })
]

if (process.env.NODE_ENV !== 'production') {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            level: process.env.LOG_LEVEL || 'debug'
        }),
        ...fileTransports
    );
} else {
    transports.push(
        ...fileTransports
    );
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta: { service: 'inventory' },
    transports: transports
})

logger.exceptions.handle(
    new winston.transports.File({
        filename: `${logDir}/exceptions.log`,
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
        )
    })
)

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at: %s, reason: %s', promise, reason);
    // Optionally exit the process
    // process.exit(1);
})

export default logger;