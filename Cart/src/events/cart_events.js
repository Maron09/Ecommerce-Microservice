import logger from "../utils/logger.js";
import withTransaction from "../helpers/transactions.js";
import Cart from "../models/cart.js";


class CartEvents {
    static async onCartAdded(data) {
        if (!data?.userId || !data?.productId || !data?.productName || !data?.price || !data?.inventoryCode || !data?.quantity) {
            logger.error("Invalid cart addition data", data);
            throw new Error("Invalid data for Cart Addition");
        }
        logger.info("Received cart addition event", data);
        return await withTransaction(async (session) => {
            // Add the item to the cart
            let cart = await Cart.findOne({ userId: data.userId }, null, { session });
            if (!cart) {
                cart = new Cart({
                    userId: data.userId,
                    items: [{
                        productId: data.productId,
                        productName: data.productName,
                        price: data.price,
                        inventoryCode: data.inventoryCode,
                        quantity: data.quantity
                    }]
                })
                await cart.save({ session });
                logger.info("Created new cart for user", { userId: data.userId });
            } else {
                const existingItem = cart.items.find(item => item.productId.toString() === data.productId);
                if (existingItem) {
                    existingItem.quantity += data.quantity;
                    logger.info("Updated quantity for existing cart item", { productId: data.productId, newQuantity: existingItem.quantity });
                } else {
                    cart.items.push({
                        productId: data.productId,
                        productName: data.productName,
                        price: data.price,
                        inventoryCode: data.inventoryCode,
                        quantity: data.quantity
                    })
                    logger.info("Added new item to existing cart", { productId: data.productId });
                }
                cart.updatedAt = new Date();
                await cart.save({ session });
            } 
            logger.info("Processed cart addition event", data);
            return cart;
        }, "CartEvents.onCartAdded");
    }
}

export default CartEvents;