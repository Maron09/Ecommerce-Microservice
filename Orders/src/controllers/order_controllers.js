import Order from "../models/orders.js";
import OrderItem from "../models/orderItem.js";
import withTransaction from "../helpers/transactions.js";
import logger from "../utils/logger.js";
import rabbitMQClient from "../utils/rabbit.js";
import VendorClient from "../utils/vendorClient.js";


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

    static async proceedToPayment(req, res) {
        logger.info("Proceeding to payment...");

        const { orderId } = req.params;
        if (!orderId) {
            logger.warn("Order ID missing from request parameters");
            return res.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            logger.warn("User ID missing from request");
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        try{
            const order = await Order.findOne({ _id: orderId, userId });
            if (!order) {
                logger.info("Order not found for user", { userId, orderId });
                return res.status(404).json({
                    success: false,
                    message: "Order not found",
                });
            }
            const orderItems = await OrderItem.find({ orderId: order._id }).lean();
            if (orderItems.length === 0) {
                logger.info("No items found in order", { userId, orderId });
                return res.status(400).json({
                    success: false,
                    message: "Order has no items",
                });
            }


            if (order.paymentStatus !== 'pending') {
                logger.warn("Order is not in a payable state", { userId, orderId, status: order.status });
                return res.status(400).json({
                    success: false,
                    message: "Order cannot be processed for payment",
                });
            }
            const orderItemsWithVendors = await Promise.all(
                orderItems.map(async (item) => {
                    try {
                        const vendorId = await VendorClient.fetchVendorId(item.productId);
                        return { ...item, vendorId }; // attach vendorId here
                    } catch (error) {
                        logger.error("Error fetching vendor for product", { productId: item.productId, error: error.message });
                        return item;
                    }
                })
            );
            const uniqueVendorIds = [...new Set(orderItemsWithVendors.map(item => item.vendorId))];
            await rabbitMQClient.publish('order.payment', {
                userId,
                orderId: order._id,
                amount: order.totalAmount,
                items: orderItemsWithVendors,
                vendorIds: uniqueVendorIds
            })
            logger.info("Published 'order.payment' event successfully", {
                orderId: order._id,
                vendorCount: uniqueVendorIds.length,
            });
            return res.status(200).json({
                success: true,
                message: "Payment process initiated successfully",
                data: {
                    orderId: order._id,
                    amount: order.totalAmount,
                    vendorIds: uniqueVendorIds,
                },
            });
        } catch (error) {
            logger.error("Error proceeding to payment", { error: error.message });
            return res.status(500).json({
                success: false,
                message: "Server Error"
            });
        }
    }
}


export default OrderControllers;