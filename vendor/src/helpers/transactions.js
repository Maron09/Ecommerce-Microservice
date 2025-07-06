import mongoose from "mongoose";
import logger from "../utils/logger.js";



const withTransaction = async (handleFn, context = '') => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const result = await handleFn(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        logger.error(`[${context}] Transaction failed`, error);
        throw error;
    } finally {
        session.endSession();
    }
}

export default withTransaction;
