import proxy from "express-http-proxy"
import logger from "../utils/logger.js"


function CreateProxy(targetBaseURL, serviceName = "Unknown Service", options = {}) {
    const {
        pathRewriteRegex = /^\/v1/,
        replacement = "/api",
        parseReqBody = true
    } = options

    return proxy(targetBaseURL, {
        parseReqBody,
        proxyReqPathResolver: (req) => {
            return req.originalUrl.replace(pathRewriteRegex, replacement)
        },

        proxyErrorHandler: (err, req, res, next) => {
            logger.error(`Proxy Error on ${req.method} ${req.originalUrl}: ${err.message}`)
            res.status(500).json({
                message: "Internal Server Error",
                error: err.message
            })
        },
        userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
            logger.info(`Response from  ${serviceName} ${userReq.method} ${userReq.originalUrl}: ${proxyRes.statusCode}`)
            return proxyResData
        },
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers["x-user-id"] = srcReq.user?.userID || ''
            return proxyReqOpts;
        }
    })
}

export default CreateProxy