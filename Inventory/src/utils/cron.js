import { checkLowStock, resetLowStockFlags, processPendingMessages } from "./task.js"
import cron from "node-cron";
import InventoryEvents from "../events/inventory_events.js";


cron.schedule("*/10 * * * *", async () => {
    try {
        await checkLowStock();
        await resetLowStockFlags();
    } catch (error) {
        console.error("Error running scheduled tasks:", error);
    }
});

cron.schedule("*/5 * * * *", async () => {
    await processPendingMessages(process.env.EVENTS, 'product.created', InventoryEvents.onProductCreated);
    
    await processPendingMessages(process.env.EVENTS, 'product.updated', InventoryEvents.onProductUpdated);
});