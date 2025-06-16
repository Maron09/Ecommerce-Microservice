import logger from "../utils/logger.js";


class LoggerMiddleware {
    static async requestLogger(req, res, next) {
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.url
        const userAgent = req.get('User-Agent') || 'Unknown';

        res.on('finish', () => {
            const statusCode = res.statusCode
            logger.info(`Received [${timestamp}] ${method} ${url} - ${statusCode} - ${userAgent}`)
            // logger.info(`Request Body, ${JSON.stringify(req.body)}`)
        })

        next();
    }

    static addTimeStamp(req, res, next) {
        req.timestamp = new Date().toISOString()
        next()
    }
}

export default LoggerMiddleware;