import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";

class AuthMiddleware {
    static async verifyToken(req, res, next) {
        const userId = req.headers["x-user-id"];
        const userRole = req.headers["x-user-role"];
        if (!userId || !userRole) {
            logger.error("Unauthorized access attempt: No user ID provided");
            return res.status(401).json({ success: false, message: "Unauthorized: No user ID provided" });
        }
        req.user = {userId,
            role: userRole
        };
        next();
    }
}

export default AuthMiddleware;