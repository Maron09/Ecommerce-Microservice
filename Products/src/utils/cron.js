import { processPendingMessages } from "./task.js"
import cron from "node-cron";
import ProductEvents from "../events/product_events.js";




cron.schedule("*/5 * * * *", async () => {
    await processPendingMessages(process.env.EVENTS, 'vendor.approved', ProductEvents.onVendorApproved);
    
});