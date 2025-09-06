import { processPendingMessages } from "./task.js"
import cron from "node-cron";
import VendorEvents from "./events/vendor_events.js";




cron.schedule("*/5 * * * *", async () => {
    await processPendingMessages(process.env.EVENTS, 'user.is_verified.profile_create', VendorEvents.onVendorCreated);
    
    await processPendingMessages(process.env.EVENTS, 'vendor.approved', VendorEvents.onVendorIsApproved);
});