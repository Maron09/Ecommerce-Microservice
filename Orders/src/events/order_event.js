import Order from "../models/orders.js";
import OrderItem from "../models/orderItem.js";
import withTransaction from "../helpers/transactions.js";
import logger from "../utils/logger.js";

class OrderEvents {
    static async onOrderCreated(data) {
        if (!data?.userId || !data?.total || !data?.items) {
            logger.error("Invalid order creation data", data);
            throw new Error("Invalid data for Order Creation");
        }

        logger.info("Received order creation event", data);

        return await withTransaction(async (session) => {
            const order = await Order.create([{
                userId: data.userId,
                totalAmount: data.total,
                paymentStatus: data.paymentStatus || "pending",
                orderStatus: data.orderStatus || "processing"
            }], { session });
            logger.info("Order created", { orderId: order[0]._id, userId: data.userId });

            const orderItems = data.items.map((item) => ({
                orderId: order[0]._id,
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            }))
            await OrderItem.insertMany(orderItems, { session });
            
            logger.info("Order items created", { orderId: order[0]._id, itemCount: orderItems.length });

            return order[0];
        })
    }

    static async onPaymentCompleted(data) {
        if (!data?.orderId || !data?.status) {
            logger.error("Invalid payment completion data", data);
            throw new Error("Invalid data for Payment Completion");
        }

        logger.info("Received payment completion event", data);

        return await withTransaction(async (session) => {
            const order = await Order.findById(data.orderId).session(session);
            if (!order) {
                logger.error("Order not found", { orderId: data.orderId });
                throw new Error("Order not found");
            }
            if (data.status === "success") {
                order.orderStatus = "shipped"
                order.paymentStatus = "paid"
            } else if (data.status === "failed") {
                order.paymentStatus = "failed"
            } else if (data.status === "refunded") {
                order.paymentStatus = "refunded"
                order.orderStatus = "cancelled"
            }
            await order.save({ session });

            logger.info("Order payment status updated", { orderId: order._id, status: data.status });

            return order;
        });
    }
}

export default OrderEvents;