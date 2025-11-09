import express from "express"
import "./helpers/env.js"
import "./utils/cron.js"
import ConnectToDB from "./database/db.js"
import corsConfig from "./config/CorsConfig.js"
import LoggerMiddleware from "./middleware/RequestLogger.js"
import helmet from "helmet"
import errorHandler from "../../Auth/src/middleware/Error_handler.js"
import logger from "./utils/logger.js"
import rabbitMQClient from "./utils/rabbit.js"
import NotificationEvents from "./events/Notification_events.js"


const app = express()
const PORT = process.env.PORT || 3002

ConnectToDB()


app.use(helmet())
app.use(LoggerMiddleware.requestLogger)
app.use(LoggerMiddleware.addTimeStamp)
app.use(corsConfig())
app.use(express.json)


app.use(errorHandler)


async function startServer() {
    try {
        await rabbitMQClient.connect(process.env.EVENTS, process.env.TOPIC, {durable: false})
        logger.info("RabbitMQ connected Successfully")

        await rabbitMQClient.consume('user.verification_code.created', NotificationEvents.handleVerification)

        await rabbitMQClient.consume('user.verification_code.resend', NotificationEvents.handleResendOTP)

        await rabbitMQClient.consume('user.profile.updated', NotificationEvents.handleProfileUpdate)

        await rabbitMQClient.consume('user.is_verified', NotificationEvents.handleVerifyuser)

        await rabbitMQClient.consume('user.forgot_password_code.send', NotificationEvents.handleForgotPassword)

        await rabbitMQClient.consume('user.password_reset', NotificationEvents.handleResetPassword)

        await rabbitMQClient.consume('notification.vendorApproved', NotificationEvents.handleVendorApproved)

        await rabbitMQClient.consume('inventory.low_count', NotificationEvents.handleLowStockMessage)

        await rabbitMQClient.consume('order.customer.notify', NotificationEvents.handleOrderNotification)
        await rabbitMQClient.consume('order.vendor.notify', NotificationEvents.handleOrderNotification)
        app.listen(PORT, () => {
            logger.info(`🚀 Notification service is running on port:${PORT}`);
        })
    } catch(error){
        logger.error("Error starting server", error.stack)
    }
}

startServer()