import { processPendingMessages } from "./task.js"
import cron from "node-cron";
import OrderEvents from "../events/order_event.js";

cron.schedule("*/5 * * * *", async() => {
    await processPendingMessages(process.env.EVENTS, 'order.placed', OrderEvents.onOrderCreated);
    await processPendingMessages(process.env.EVENTS, 'payment.verified', OrderEvents.onPaymentCompleted);
})