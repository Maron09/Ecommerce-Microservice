import { processPendingMessages } from "./task.js"
import cron from "node-cron";
import CustomerEvents from "./events/customer_events.js";




cron.schedule("*/5 * * * *", async () => {
    await processPendingMessages(process.env.EVENTS, 'user.is_verified.profile_create', CustomerEvents.onCustomerCreated);
    
});