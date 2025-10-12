import logger from "../utils/logger.js";
import withTransaction from "../helpers/transactions.js";
import Cart from "../models/cart.js";


class CartEvents {
    static async onCartAdded(data) {
        if (
            !data?.userId ||
            !data?.productId ||
            !data?.productName ||
            !data?.price ||
            !data?.inventoryCode ||
            !data?.quantity
        ) {
            logger.error("Invalid cart addition data", data);
            throw new Error("Invalid data for Cart Addition");
        }

        logger.info("Received cart addition event", data);

        return await withTransaction(async (session) => {
            let cart = await Cart.findOne({ userId: data.userId }, null, { session });

            if (!cart) {
                // No cart yet → create new one
                cart = new Cart({
                    userId: data.userId,
                    items: [
                        {
                            productId: data.productId,
                            productName: data.productName,
                            price: data.price,
                            inventoryCode: data.inventoryCode,
                            quantity: data.quantity
                        }
                    ]
                });

                await cart.save({ session });
                logger.info("Created new cart for user", { userId: data.userId });
            } else {
                // Cart exists → check if product already in cart
                const existingItem = cart.items.find(
                    (item) => item.productId.toString() === data.productId.toString()
                );

                if (existingItem) {
                    
                    // existingItem.quantity += data.quantity;
                    existingItem.price = data.price; 
                    logger.info(
                        `Updated existing product ${data.productId} quantity in cart for user ${data.userId}`
                    );
                } else {
                    // Product not in cart → push new one
                    cart.items.push({
                        productId: data.productId,
                        productName: data.productName,
                        price: data.price,
                        inventoryCode: data.inventoryCode,
                        quantity: data.quantity
                    });
                    logger.info(
                        `Added new product ${data.productId} to cart for user ${data.userId}`
                    );
                }

                await cart.save({ session });
            }

            logger.info("Processed cart addition event", data);
            return cart;
        }, "CartEvents.onCartAdded");
    }

}

export default CartEvents;