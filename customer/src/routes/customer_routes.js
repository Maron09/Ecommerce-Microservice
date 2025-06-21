import express from "express";
import CustomerControllers from "../controllers/Customer_controllers.js";
import AuthMiddleware from "../middleware/Auth_middlware.js";


const router = express.Router();

router.get("/profile", AuthMiddleware.verifyToken, CustomerControllers.customerProfile);
router.put("/profile", AuthMiddleware.verifyToken, CustomerControllers.updateCustomerProfile);
router.post("/address", AuthMiddleware.verifyToken, CustomerControllers.addCustomerAddress);
router.get("/address", AuthMiddleware.verifyToken, CustomerControllers.customerAddresses);
router.get("/address/:addressId", AuthMiddleware.verifyToken, CustomerControllers.getCustomerAddress);
router.put("/address/:addressId", AuthMiddleware.verifyToken, CustomerControllers.updateCustomerAddress);
router.delete("/address/:addressId", AuthMiddleware.verifyToken, CustomerControllers.deleteCustomerAddress);

export default router;
