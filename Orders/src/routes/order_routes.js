import OrderControllers from "../contollers/order_controllers.js";
import express from "express";
import AuthMiddleware from "../middleware/Auth_middlware.js";

const router = express.Router();

router.get("/", AuthMiddleware.verifyToken, OrderControllers.getOrders)


export default router