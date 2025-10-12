import CartControllers from "../controllers/cart_controllers.js";
import express from "express";
import AuthMiddleware from "../middleware/Auth_middlware.js";

const router = express.Router();

router.get("/", AuthMiddleware.verifyToken, CartControllers.getCart)
router.put("/", AuthMiddleware.verifyToken, CartControllers.updateCartItem)
router.delete("/:productId", AuthMiddleware.verifyToken, CartControllers.deleteItemFromCart)
router.post("/checkout", AuthMiddleware.verifyToken, CartControllers.checkoutCart)
router.post("/place-order/:checkoutId", AuthMiddleware.verifyToken, CartControllers.placeOrder)


export default router