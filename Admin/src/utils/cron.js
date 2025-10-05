import { processPendingMessages } from "./task.js"
import cron from "node-cron";
import AdminEvents from "../events/admin_events.js";




cron.schedule("*/5 * * * *", async () => {
    await processPendingMessages(process.env.EVENTS, 'user.is_verified.profile_create', AdminEvents.onAdmincreated);
    await processPendingMessages(process.env.EVENTS, 'user.created', AdminEvents.onUserCreated);
    await processPendingMessages(process.env.EVENTS, 'user.verified', AdminEvents.onUserIsVerified);
    await processPendingMessages(process.env.EVENTS, 'customer.created', AdminEvents.onCustomerCreated);
    await processPendingMessages(process.env.EVENTS, 'vendor.created', AdminEvents.onVendorCreated);
    await processPendingMessages(process.env.EVENTS, 'vendor.KYC', AdminEvents.onCompleteVendorProfile);
    await processPendingMessages(process.env.EVENTS, 'vendor.subaccount', AdminEvents.onSubAccountCreated);

});