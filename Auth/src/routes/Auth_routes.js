import express from "express"
import AuthController from "../controllers/Auth_controller.js"
import RateLimiter from "../middleware/Limit_endpoint.js";

const router = express.Router();

const authLimiter = RateLimiter.create({
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 100,
    timeWindow: process.env.RATE_LIMIT_TIME_WINDOW ? parseInt(process.env.RATE_LIMIT_TIME_WINDOW) : 1 * 60 * 1000,
})

router.post("/register/admin", authLimiter, AuthController.RegisterAdmin);
router.post("/register/vendor", authLimiter, AuthController.RegisterVendor);
router.post("/register/customer", authLimiter, AuthController.RegisterCustomer);

export default router;
