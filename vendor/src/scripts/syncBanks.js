import "../helpers/env.js"
import fetchBanks from "../utils/paystackServices.js"
import Bank from "../models/Banks.js"
import logger from "../utils/logger.js"
import ConnectToDB from "../database/db.js"

const syncBanks = async () => {
    logger.info("Fetching Banks....")

    try {
        await ConnectToDB()
        const banks = await fetchBanks()
        await Bank.deleteMany()
        await Bank.insertMany(banks)

        logger.info("Banks Synced", banks.length)
    } catch(error) {
        logger.error("error getting the banks", error.stack)
        throw error
    } finally {
        process.exit(0)
    }
}

syncBanks()