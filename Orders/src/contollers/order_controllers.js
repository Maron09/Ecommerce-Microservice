import Order from "../models/orders.js";
import OrderItem from "../models/orderItem.js";
import withTransaction from "../helpers/transactions.js";
import logger from "../utils/logger.js";


class OrderControllers {
    static async getOrders(req, res) {
        logger.info("Fetching orders for user...");

        try {
            const userId = req.user?.userId || req.user?.id;

            if (!userId) {
                logger.warn("User ID missing from request");
                return res.status(400).json({
                    success: false,
                    message: "User ID is required",
                });
            }

            const orders = await Order.findOne({ userId }).lean();

            if (!orders) {
                logger.info("No orders found for user", { userId });
                return res.status(404).json({
                    success: false,
                    message: "No orders found for this user",
                });
            }

            const orderItems = await OrderItem.find({ orderId: orders._id }).lean();
            
            logger.info("Orders fetched successfully", { userId, orderCount: orderItems.length });
            return res.status(200).json({
                success: true,
                orders: {
                    ...orders,
                    items: orderItems
                }
            });
        } catch (error) {
            logger.error("Error fetching orders", { error: error.message });
            return res.status(500).json({
                success: false,
                message: "Server Error"
            });
        }
    }
}


export default OrderControllers;