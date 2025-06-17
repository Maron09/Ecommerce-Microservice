import Customer from "../models/Customer.js";
import logger from "../utils/logger.js";


class CustomerControllers {
    static async customerProfile(req, res){
        logger.info("Fetching customer profile");
        try {
            const userId = req.user.userId;
            console.log("User ID from request", { userId });

            const customer = await Customer.findOne({ userId });
            if (!customer) {
                logger.warn("Customer not found", { userId });
                return res.status(404).json({ success: false, message: "Customer not found" });
            }

            logger.info("Customer profile fetched successfully", { userId });
            return res.status(200).json({ success: true, data: customer });
        } catch (error) {
            logger.error("Error fetching customer profile", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
}

export default CustomerControllers;