import express from "express"
import AuthMiddleware from "../middleware/Auth_middlware.js"
import AdminControllers from "../controllers/admin_controllers.js"



const router = express.Router()

router.get("/users", AuthMiddleware.verifyToken, AdminControllers.getAllUsers)
router.get("/customers", AuthMiddleware.verifyToken, AdminControllers.getAllCustomers)
router.get("/vendors", AuthMiddleware.verifyToken, AdminControllers.getAllVendors)
router.put("/approve-vendors", AuthMiddleware.verifyToken, AdminControllers.approveVendor)


export default router