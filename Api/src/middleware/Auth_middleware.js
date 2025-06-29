import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";
import "../helpers/env.js"


class AuthMiddleware {
    static ValidateToken(req, res, next) {
        const authHeader = req.headers[process.env.AUTH_HEADER || 'authorization'];

        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            logger.warn("No Token Provided");
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
        }
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                logger.warn("Invalid Token", err);
                return res.status(403).json({
                    success: false,
                    message: "Forbidden"
                });
            }

            req.user = user;
            req.headers["x-user-role"] = user.role;
            next()
        })
    }
}

export default AuthMiddleware;