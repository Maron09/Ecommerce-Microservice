import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import "../helpers/env.js"
import RefreshToken from '../models/RefreshToken_model.js';
import VerificationCode from '../models/verificationCode_model.js';
import PasswordResetCode from '../models/Password_reset_model.js';


// const generateTokens = async (user) => {
//     const accessToken = jwt.sign({
//         userId: user._id,
//         email: user.email,
//         role: user.role
//     }, process.env.JWT_SECRET, {
//         expiresIn: '60m'
//     })

//     const refreshToken = crypto.randomBytes(40).toString('hex');
//     const expiresAt = new Date()
//     expiresAt.setDate(expiresAt.getDate() * 7); // 7 days from now

//     await RefreshToken.create({
//         token: refreshToken,
//         user: user._id,
//         expiresAt
//     });
//     return {
//         accessToken,
//         refreshToken,
//     };
// }


class TokenService {
    static async generateTokens(user) {
        try{
            const accessToken = jwt.sign({
                userId: user._id,
                email: user.email,
                role: user.role
            }, process.env.JWT_SECRET, {
                expiresIn: '60m'
            });

            const refreshToken = crypto.randomBytes(40).toString('hex');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

            await RefreshToken.create({
                token: refreshToken,
                user: user._id,
                expiresAt
            });

            return {
                accessToken,
                refreshToken,
            };
        } catch (error) {
            throw new Error("Error generating tokens: " + error.message);
        }
    }

    static async generateVerificationOTP(user) {
        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await VerificationCode.create({
                user: user._id,
                code,
                type: "email",
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
            });
            return code;
        } catch (error) {
            throw new Error("Error generating verification OTP: " + error.message);
        }
    }

    static async generateForgotPasswordOTP(user) {
        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            await PasswordResetCode.create({
                user: user._id,
                code,
                type: "email",
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
            });
            return code;
        } catch (error) {
            throw new Error("Error generating forgot password OTP: " + error.message);
        }
    }
}



export default TokenService;