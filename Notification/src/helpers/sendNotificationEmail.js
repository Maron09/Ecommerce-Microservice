import sendEmail from "./mail.js";

async function sendNotificationEmail({ email, subject, type, payload }) {
    const { firstName = "", lastName = "", OTP = "000000" } = payload || {}

    let html = ""

    switch (type) {
        case "VERIFICATION":
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${firstName},</h2>
                    <p style="font-size: 16px; color: #555;">
                    Thank you for registering. Your verification code is:
                    </p>
                    <div style="font-size: 32px; font-weight: bold; color: #000; text-align: center; margin: 20px 0;">
                    ${OTP}
                    </div>
                    <p style="font-size: 14px; color: #888;">
                    This code will expire in 15 minutes. If you did not request this, please ignore this email.
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            ;
            subject = subject || "Your Verification Code";
            break
        
        case "RESEND_OTP":
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${firstName},</h2>
                    <p style="font-size: 16px; color: #555;">
                    Your OTP has been resent. Your verification code is:
                    </p>
                    <div style="font-size: 32px; font-weight: bold; color: #000; text-align: center; margin: 20px 0;">
                    ${otpcode}
                    </div>
                    <p style="font-size: 14px; color: #888;">
                    This code will expire in 15 minutes. If you did not request this, please ignore this email.
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            ;
            subject = subject || "Your Resent Verification Code"
            break
        
        case "WELCOME":
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${firstName},</h2>
                    <p style="font-size: 16px; color: #555;">
                    Your account has been successfully verified. Welcome aboard!
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            ;
            subject = subject || "Account Verification Successful"
            break
        
        case "FORGOT_PASSWORD":
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${firstName},</h2>
                    <p style="font-size: 16px; color: #555;">
                    You requested a password reset. Your verification code is:
                    </p>
                    <div style="font-size: 32px; font-weight: bold; color: #000; text-align: center; margin: 20px 0;">
                    ${otpcode}
                    </div>
                    <p style="font-size: 14px; color: #888;">
                    This code will expire in 15 minutes. If you did not request this, please ignore this email.
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            ;
            subject = subject || "Your Password Reset Code"
            break
        
        case "RESET_PASSWORD":
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${firstName},</h2>
                    <p style="font-size: 16px; color: #555;">
                    Your password has been successfully reset. If you did not request this change, please contact support.
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            ;
            subject = subject || "Password Reset Successful"
            break
        
        case "VERIFICATION":
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${payload},</h2>
                    <p style="font-size: 16px; color: #555;">
                    Your Email has been Updated. Your verification code is:
                    </p>
                    <div style="font-size: 32px; font-weight: bold; color: #000; text-align: center; margin: 20px 0;">
                    ${otpcode}
                    </div>
                    <p style="font-size: 14px; color: #888;">
                    This code will expire in 15 minutes. If you did not request this, please ignore this email.
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
                `
            ;
            subject = subject || "Email Change Verification Code"
            break
        
        case "APPROVED":
            html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                    <h2 style="color: #333;">Hello ${firstName} ${lastName},</h2>
                    <p style="font-size: 16px; color: #555;">
                        Congratulations! Your vendor account has been approved. 🎉<br/>
                        You can now log in and start selling on our platform.
                    </p>
                    <p style="font-size: 14px; color: #888;">
                        If you have any questions, reach out to support.
                    </p>
                    <p style="font-size: 14px; color: #888;">– The Team</p>
                </div>
            `;
            subject = subject || "Vendor Account Approved"
            break
        
        default:
            html = `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Hello ${firstName || "there"},</h2>
                    <p>This is a notification from our service.</p>
                </div>
            `;
            subject = subject || "Notification";
    }

    await sendEmail(email, subject, html)
}


export default sendNotificationEmail