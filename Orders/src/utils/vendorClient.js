import axios from "axios";
import logger from "./logger.js";

class VendorClient {
    static async fetchVendorId(productId) {
        try {
            const response = await axios.get(
                `${process.env.PRODUCT_SERVICE}/api/store/product/${productId}`
            );
            
            const vendorId = response.data?.data?.vendorId;

            if (!vendorId) {
                logger.error("Vendor ID not found in product response", response.data);
                throw new Error("Vendor ID not found");
            }

            logger.info(`Vendor ID fetched successfully: ${vendorId}`);
            return vendorId;

        } catch (error) {
            logger.error("Error fetching vendor ID:", error.message);
            throw new Error("Error fetching vendor ID");
        }
    }
}

export default VendorClient;
