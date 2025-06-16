import logger from "../utils/logger.js";

class AuthMiddleware {
    static async verifyToken(req, res, next) {
        const userId = req.headers["x-user-id"];
        if (!userId) {
            logger.error("Unauthorized access attempt: No user ID provided");
            return res.status(401).json({ success: false, message: "Unauthorized: No user ID provided" });
        }
        req.user = {userId};
        next();
    }
}

export default AuthMiddleware;