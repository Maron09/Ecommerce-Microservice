import { processPendingMessages } from "./task.js"
import cron from "node-cron";
import NotificationEvents from "./events/Notification_events.js"




cron.schedule("*/5 * * * *", async () => {
    await processPendingMessages(process.env.EVENTS, 'user.verification_code.created', NotificationEvents.handleVerification);
    await processPendingMessages(process.env.EVENTS, 'user.verification_code.resend', NotificationEvents.handleResendOTP);
    await processPendingMessages(process.env.EVENTS, 'user.profile.updated', NotificationEvents.handleProfileUpdate);
    await processPendingMessages(process.env.EVENTS, 'user.is_verified', NotificationEvents.handleVerifyuser);
    await processPendingMessages(process.env.EVENTS, 'user.forgot_password_code.send', NotificationEvents.handleForgotPassword);
    await processPendingMessages(process.env.EVENTS, 'user.password_reset', NotificationEvents.handleResetPassword);
    await processPendingMessages(process.env.EVENTS, 'notification.vendorApproved', NotificationEvents.handleVendorApproved);
    await processPendingMessages(process.env.EVENTS, 'inventory.low_count', NotificationEvents.handleLowStockMessage);


});