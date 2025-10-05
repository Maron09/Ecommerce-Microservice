import Cart from "../models/cart.js";
import logger from "../utils/logger.js";
import withTransaction from "../helpers/transactions.js";




class CartControllers {
    static async getCart(req, res) {
    logger.info("Fetching cart page for user...");

    try {
        const userId = req.user?.userId || req.user?.id; // handle both cases safely

        if (!userId) {
            logger.warn("User ID missing from request");
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const cart = await Cart.findOne({ userId })
            .populate({
                path: "items.productId",
                select: "productName price stock images status", // limit the fields for clarity
            })
            .lean(); // improves performance by returning plain JS object

        if (!cart || !cart.items?.length) {
            logger.info(`No cart found for user ${userId}`);
            return res.status(404).json({
                success: false,
                message: "Your cart is empty",
                data: [],
            });
        }

        logger.info(`Cart fetched successfully for user ${userId}`);
        return res.status(200).json({
            success: true,
            message: "Cart retrieved successfully",
            data: cart,
        });
    } catch (error) {
        logger.error("Error retrieving cart page", {
            error: error.stack || error.message,
        });
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

}

export default CartControllers;