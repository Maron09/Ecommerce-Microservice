import paystack from "./paystack.js";
import logger from "./logger.js";

const fetchBanks = async () => {
    try {
        const response = await paystack.get('/bank', {
            params: { currency: "NGN" }
        })
        return response.data.data
    } catch(error){
        logger.error("Failed to fetch banks from paystack", error.stck)
        throw error
    }
}

export default fetchBanks