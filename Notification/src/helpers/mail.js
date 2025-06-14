import nodemailer from "nodemailer"
import logger from "../utils/logger.js"


const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
})


const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        }
        await transporter.sendMail(mailOptions)
        
    } catch(error) {
        logger.error("❌ Email sending failed:", error);
    }
}


export default sendEmail