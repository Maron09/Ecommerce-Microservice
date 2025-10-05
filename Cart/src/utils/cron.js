import { processPendingMessages } from "./task.js"
import cron from "node-cron";
import CartEvents from "../events/cart_events.js";

cron.schedule("*/5 * * * *", async() => {
    await processPendingMessages(process.env.EVENTS, 'cart.added', CartEvents.onCartAdded);
})