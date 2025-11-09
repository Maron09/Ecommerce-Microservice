import OrderControllers from "../controllers/order_controllers.js";
import express from "express";
import AuthMiddleware from "../middleware/Auth_middlware.js";

const router = express.Router();

router.get("/", AuthMiddleware.verifyToken, OrderControllers.getOrders)
router.post("/proceed_to_payment/:orderId", AuthMiddleware.verifyToken, OrderControllers.proceedToPayment)


export default router