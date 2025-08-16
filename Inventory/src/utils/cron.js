import { checkLowStock, resetLowStockFlags } from "./task.js"
import cron from "node-cron";


cron.schedule("*/10 * * * *", async () => {
    try {
        await checkLowStock();
        await resetLowStockFlags();
    } catch (error) {
        console.error("Error running scheduled tasks:", error);
    }
});