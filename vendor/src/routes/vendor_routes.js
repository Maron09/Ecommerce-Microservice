import express from "express"
import VendorControllers from "../controllers/vendor_controllers.js"
import AuthMiddleware from "../middleware/Auth_middlware.js"


const router = express.Router()

router.get("/profile", AuthMiddleware.verifyToken, VendorControllers.vendorProfile)
router.put("/profile/kyc", AuthMiddleware.verifyToken, VendorControllers.completeVendorProfile)
router.post("/add-bank", AuthMiddleware.verifyToken, VendorControllers.addbankDetails)


export default router