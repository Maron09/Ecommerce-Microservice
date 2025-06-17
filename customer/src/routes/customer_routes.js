import express from "express";
import CustomerControllers from "../controllers/Customer_controllers.js";
import AuthMiddleware from "../middleware/Auth_middlware.js";


const router = express.Router();

router.get("/profile", AuthMiddleware.verifyToken, CustomerControllers.customerProfile);

export default router;
