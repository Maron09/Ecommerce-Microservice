import express from "express"
import AuthController from "../controllers/Auth_controller.js"
import RateLimiter from "../middleware/Limit_endpoint.js";

const router = express.Router();

const authLimiter = RateLimiter.create({
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 1000,
    timeWindow: process.env.RATE_LIMIT_TIME_WINDOW ? parseInt(process.env.RATE_LIMIT_TIME_WINDOW) : 1 * 60 * 1000,
})

router.post("/register/admin", authLimiter, AuthController.RegisterAdmin);
router.post("/register/vendor", authLimiter, AuthController.RegisterVendor);
router.post("/register/customer", authLimiter, AuthController.RegisterCustomer);
router.post("/resend-otp", authLimiter, AuthController.resendOTP)
router.post("/verify-otp", authLimiter, AuthController.verifyUser);
router.post("/login", authLimiter, AuthController.loginUser);
router.post("/logout", authLimiter, AuthController.logoutUser);
router.post("/forgot-password", authLimiter, AuthController.forgotPassword);
router.post("/reset-password", authLimiter, AuthController.resetPassword);

export default router;
