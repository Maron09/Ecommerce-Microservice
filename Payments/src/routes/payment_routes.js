import express from "express";
import PaymentControllers from "../controllers/payment_controllers.js";
import AuthMiddleware from "../middleware/Auth_middlware.js";

const router = express.Router();

router.post("/initialize/:orderId", AuthMiddleware.verifyToken, PaymentControllers.initializePayment);
router.get("/verify", AuthMiddleware.verifyToken, PaymentControllers.verifyPayment);
// router.post("/webhook", PaymentControllers.handleWebhook);

export default router;