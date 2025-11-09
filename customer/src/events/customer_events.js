import logger from "../utils/logger.js";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import rabbitMQClient from "../utils/rabbit.js";
import withTransaction from "../helpers/transactions.js";


class CustomerEvents {
    static async onCustomerCreated(data){
        if (data.role !== "customer") {
            logger.warn("Received event for non-customer role, skipping", data);
            return;
        }
        if (!data?.userId || !data?.firstName || !data?.lastName || !data?.email) {
            logger.error("Invalid data received for customer creation", data);
            throw new Error("Invalid data for customer creation");
        }
        logger.info("Received customer created event", data);
        return await withTransaction(async (session) => {
            const exist = await Customer.findOne({ userId: data.userId }, null, { session })

            if (exist) return

            logger.info("Creating new customer...");
            const [newCustomer] = await Customer.create([{
                userId: data.userId,
                firstName: data.firstName,
                lastName: data.lastName,
                fullName: `${data.firstName} ${data.lastName}`,
                email: data.email,
            }], { session });
            logger.info("Customer created successfully");

            await rabbitMQClient.publish('customer.created', {
                customerId: newCustomer._id.toString(),
                userId: newCustomer.userId,
                firstName: newCustomer.firstName,
                lastName: newCustomer.lastName,
                email: newCustomer.email
            })
        })
    }

    static async onOrderPlaced(data) {
        if (!data?.items || !Array.isArray(data.items) || data.items.length === 0) {
            logger.error("Invalid data received for order placed", data);
            throw new Error("Invalid data for order placed");
        }

        logger.info("Received order placed event", {
            itemCount: data.items.length,
            userId: data.userId
        });
        return await withTransaction(async (session) => {
            const customer = await Customer.findOne({ userId: data.userId }, null, { session });
            if (!customer) {
                logger.error("Customer not found for the given user ID", { userId: data.userId });
                return;
            }

            const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const payload = {
                customerName: customer.fullName,
                items: data.items,
                totalAmount
            }
            await rabbitMQClient.publish("order.customer.notify", {
                type: "ORDER_CUSTOMER_NOTIFICATION",
                email: customer.email,
                payload
            })
            logger.info("Published 'order.customer.notification' event", {
                email: customer.email,
                itemCount: data.items.length,
                totalAmount
            });
        });
    }
}


export default CustomerEvents;