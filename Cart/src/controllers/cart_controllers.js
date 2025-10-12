import Cart from "../models/cart.js";
import logger from "../utils/logger.js";
import withTransaction from "../helpers/transactions.js";
import rabbitMQClient from "../utils/rabbit.js";
import CheckoutPage from "../models/checkout.js";



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

    static async updateCartItem(req, res) {
        logger.info("Updating cart for user...");

        const userId = req.user?.userId || req.user?.id; // handle both cases safely

        if (!userId) {
            logger.warn("User ID missing from request");
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }
        return withTransaction(async (session) => {
            const { productId, quantity } = req.body;
            
            if (!productId || typeof quantity !== 'number' || quantity < 1) {
                logger.warn("Invalid product ID or quantity");
                return res.status(400).json({
                    success: false,
                    message: "Valid product ID and quantity are required",
                });
            }
            
            const productResponse = await fetch(
                `${process.env.PRODUCT_SERVICE}/api/store/product/${productId}`,
                {
                    method: "GET",
                    // headers: {
                    //     "Content-Type": "application/json",
                    //     Authorization: req.headers.authorization,
                    // },
                }
            )
            if (!productResponse.ok) {
                logger.warn(`Product ${productId} not found in Product Service`);
                return res.status(404).json({
                    success: false,
                    message: "Product not found",
                });
            }
            const productData = await productResponse.json();
            logger.info("Product data received:", productData);
            const productStock = productData?.data?.stock ?? productData?.stock ?? 0;
            if (quantity > productStock) {
                logger.warn(`Requested quantity ${quantity} exceeds stock ${productStock} for product ${productId}`);
                return res.status(400).json({
                    success: false,
                    message: `Only ${productStock} units available in stock`,
                });
            }
            const cart = await Cart.findOne({ userId }).session(session);
            if (!cart) {
                logger.info(`No cart found for user ${userId}`);
                return res.status(404).json({
                    success: false,
                    message: "Cart not found",
                });
            }
            const itemIndex = cart.items.findIndex(item => item.productId.toHexString() === productId);
            if (itemIndex === -1) {
                logger.info(`Product ${productId} not found in cart for user ${userId}`);
                return res.status(404).json({
                    success: false,
                    message: "Product not found in cart",
                });
            }
            cart.items[itemIndex].quantity = quantity;
            // TODO: add new field totalPrice in cart schema
            // cart.items[itemIndex].totalPrice = productData.price * quantity;
            cart.updatedAt = new Date();
            await cart.save({ session });
            logger.info(`Cart updated successfully for user ${userId}`);
            await rabbitMQClient.publish("cart.updated", {
                userId,
                productId,
                quantity,
            });
            return res.status(200).json({
                success: true,
                message: "Cart updated successfully",
                data: cart,
            });
        })
    }

    static async deleteItemFromCart(req, res) {
        logger.info("Deleting item from cart for user...");

        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            logger.warn("User ID missing from request");
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const { productId } = req.params;
        if (!productId) {
            logger.warn("Missing product ID");
            return res.status(400).json({
                success: false,
                message: "Valid product ID is required",
            });
        }

        try {
            // variables to hold event data we’ll publish after commit
            let publishEvent = null;
            let eventData = null;

            await withTransaction(async (session) => {
                const cart = await Cart.findOne({ userId }).session(session);
                if (!cart) {
                    logger.info(`No cart found for user ${userId}`);
                    throw { status: 404, message: "Cart not found" };
                }

                const itemIndex = cart.items.findIndex(
                    (item) => item.productId.toHexString() === productId
                );
                if (itemIndex === -1) {
                    logger.info(`Product ${productId} not found in cart`);
                    throw { status: 404, message: "Product not found in cart" };
                }

                const removedItem = cart.items[itemIndex];
                cart.items.splice(itemIndex, 1);
                cart.updatedAt = new Date();

                if (cart.items.length === 0) {
                    await Cart.deleteOne({ _id: cart._id }).session(session);
                    publishEvent = "cart.empty";
                    eventData = {
                        userId,
                        lastRemovedItem: removedItem,
                        emptiedAt: new Date(),
                    };
                } else {
                    await cart.save({ session });
                    publishEvent = "cart.item.deleted";
                    eventData = {
                        userId,
                        ...removedItem.toObject?.() || removedItem,
                        deletedAt: new Date(),
                    };
                }
            });

            // publish event AFTER successful transaction
            if (publishEvent && eventData) {
                await rabbitMQClient.publish(publishEvent, eventData);
            }

            return res.status(200).json({
                success: true,
                message:
                    publishEvent === "cart.empty"
                        ? "Item removed and cart is now empty"
                        : "Item deleted from cart successfully",
            });
        } catch (err) {
            logger.error(`Error deleting cart item: ${err.message || err}`);
            const status = err.status || 500;
            return res.status(status).json({
                success: false,
                message: err.message || "An unexpected error occurred",
            });
        }
    }

    static async checkoutCart(req, res) {
        logger.info("Checking out cart for user...");

        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            logger.warn("User ID missing from request");
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        return withTransaction(async (session) => {
            const existingCheckout = await CheckoutPage.findOne({
                userId,
                expiresAt: { $gt: new Date() }  // still valid
            });

            if (existingCheckout) {
                logger.info(`Existing checkout found for user ${userId}`);
                return res.status(200).json({
                    success: true,
                    message: "Existing checkout retrieved",
                    checkoutId: existingCheckout._id,
                    total: existingCheckout.total,
                    data: existingCheckout.cartSnapShot
                });
            }
            const cart = await Cart.findOne({ userId }).populate("items.productId")
            if (!cart || cart.items.length === 0) {
                logger.info(`No cart found for user ${userId}`)
                return res.status(400).json({
                    success: false,
                    message: "cart is empty"
                })
            }

            const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

            const checkout = await CheckoutPage.create({
                userId,
                cartSnapShot: cart.items,
                total,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000)
            })

            logger.info(`Checkout Initiated for user, checkout data ${checkout}`)
            return res.status(200).json({
                success: true,
                message: "Checkout Created for user",
                checkoutId: checkout._id,
                total,
                data: cart.items
            })
        })
    }

    static async placeOrder(req, res) {
        logger.info("Placing order for user...");

        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            logger.warn("User ID missing from request");
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }
        const { checkoutId } = req.params;
        if (!checkoutId) {
            logger.warn("Missing checkout ID");
            return res.status(400).json({
                success: false,
                message: "Valid checkout ID is required",
            });
        }

        try {
            const checkout = await CheckoutPage.findOne({ _id: checkoutId, userId });
            if (!checkout) {
                logger.info(`No checkout found for user ${userId} with ID ${checkoutId}`);
                return res.status(404).json({
                    success: false,
                    message: "Checkout not found",
                });
            }
            if (checkout.expiresAt < new Date()) {
                logger.info(`Checkout expired for user ${userId} with ID ${checkoutId}`);
                return res.status(400).json({
                    success: false,
                    message: "Checkout session has expired",
                });
            }

            await rabbitMQClient.publish("order.placed", {
                userId,
                items: checkout.cartSnapShot,
                total: checkout.total,
            })

            await CheckoutPage.deleteOne({ _id: checkoutId });

            logger.info(`Order placed successfully for user ${userId}`);
            return res.status(200).json({
                success: true,
                message: "Order placed successfully",
            });
        }catch (error) {
            logger.error("Error placing order", {
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