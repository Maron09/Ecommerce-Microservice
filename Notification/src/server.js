import express from "express"
import "./helpers/env.js"
import ConnectToDB from "./database/db.js"
import corsConfig from "./config/CorsConfig.js"
import LoggerMiddleware from "./middleware/RequestLogger.js"
import helmet from "helmet"
import errorHandler from "../../Auth/src/middleware/Error_handler.js"
import logger from "./utils/logger.js"
import rabbitMQClient from "./utils/rabbit.js"
import handleVerification from "./events/Notification_events.js"


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

        await rabbitMQClient.consume('user.verification_code.created', handleVerification)
        app.listen(PORT, () => {
            logger.info(`🚀 Notification service is running on http://localhost:${PORT}`);
        })
    } catch(error){
        logger.error("Error starting server", error.stack)
    }
}

startServer()