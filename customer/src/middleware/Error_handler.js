import logger from "../utils/logger.js";
import "../helpers/env.js"

const errorHandler = (err, req, res, next) => {
    logger.error(err.stack)

    const statusCode = err.status || 500;
    const response = {
        status: "error",
        statusCode,
        message: err.message || "Internal Server Error",
    }

    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }
    res.status(statusCode).json(response);
}

export default errorHandler;