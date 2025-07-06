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
}


export default CustomerEvents;