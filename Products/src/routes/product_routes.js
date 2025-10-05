import ProductControllers from "../controllers/product_controllers.js";
import express from "express";
import uploadMultipleImages from "../utils/multer.js";
import AuthMiddleware from "../middleware/Auth_middlware.js";


const router = express.Router();
const uploadProductImages = uploadMultipleImages("product_images", 5);

router.post("/create-product", AuthMiddleware.verifyToken, uploadProductImages, ProductControllers.createProduct)
router.delete("/product/:productId/images", AuthMiddleware.verifyToken, ProductControllers.deleteProductImagesById)
router.put("/product/:productId/images", AuthMiddleware.verifyToken, uploadProductImages, ProductControllers.updateProductImages)
router.get("/products", ProductControllers.getProducts)
router.get("/product/:productId", ProductControllers.getProductById)
router.put("/product/:productId", AuthMiddleware.verifyToken, ProductControllers.updateProduct)
router.post("/add-to-cart/:productId", AuthMiddleware.verifyToken, ProductControllers.addToCart)

export default router;