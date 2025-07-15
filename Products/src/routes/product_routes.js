import ProductControllers from "../controllers/product_controllers.js";
import express from "express";
import uploadMultipleImages from "../utils/multer.js";
import AuthMiddleware from "../middleware/Auth_middlware.js";


const router = express.Router();
const uploadProductImages = uploadMultipleImages("product_images", 5);

router.post("/product", AuthMiddleware.verifyToken, uploadProductImages, ProductControllers.createProduct)



export default router;