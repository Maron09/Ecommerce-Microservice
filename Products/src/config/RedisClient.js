import { Redis } from "ioredis"
import logger from "../utils/logger.js"
import "../helpers/env.js"


const RedisClient = new Redis(process.env.REDIS_URL)


RedisClient.on("error", (err) => {
    logger.info("Redis Error",err)
})


export default RedisClient