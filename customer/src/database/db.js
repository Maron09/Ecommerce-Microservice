import mongoose from "mongoose"
import logger from "../utils/logger.js"
import "../helpers/env.js"


const ConnectToDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000
        })
        logger.info("MongoDB Connected Successfully");
    }catch(error){
        logger.error("Failed to connect to DB", error)
        process.exit(1)
    }
}

export default ConnectToDB