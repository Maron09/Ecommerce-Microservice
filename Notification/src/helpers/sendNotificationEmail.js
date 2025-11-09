import sendEmail from "./mail.js";

async function sendNotificationEmail({ email, subject, type, payload }) {
    const { firstName = "", lastName = "", otp = "000000" } = payload || {}

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
                    ${otp}
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
        
        case "LOW_INVENTORY":
    html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #fffaf0; border: 1px solid #f0c36d;">
            <h2 style="color: #d35400;">⚠️ Low Inventory Alert</h2>
            <p style="font-size: 16px; color: #555;">
                Hello <strong>${payload.businessName}</strong>,
            </p>
            <p style="font-size: 16px; color: #555;">
                One or more of your products are running <strong style="color:#e74c3c;">low on stock</strong>.  
                Customers may not be able to purchase them soon if you don’t restock.
            </p>

            <table cellpadding="8" cellspacing="0" border="1" 
                style="border-collapse: collapse; width:100%; margin:15px 0; font-size:14px; text-align:left; background:#fff;">
                <thead style="background-color:#f8f9fa;">
                    <tr>
                        <th style="border:1px solid #ddd;">Product Name</th>
                        <th style="border:1px solid #ddd;">Stock</th>
                    </tr>
                </thead>
                <tbody>
                    ${payload.products.map(p => `
                        <tr>
                            <td style="border:1px solid #ddd;">${p.productName}</td>
                            <td style="border:1px solid #ddd; color:#e74c3c; font-weight:bold;">${p.stock}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeeba; margin: 15px 0;">
                <p style="margin: 0; font-size: 15px; color: #333;">
                    📦 <strong>Action Required:</strong> Please update your inventory to avoid missing sales.
                </p>
            </div>
            <p style="font-size: 14px; color: #888;">
                Stay ahead by restocking in time and keeping your best-sellers available.
            </p>
            <p style="font-size: 14px; color: #888;">– The Team</p>
        </div>
    `;
    subject = subject || "⚠️ Low Inventory Alert – Restock Now"
    break;

    
    case "ORDER_CUSTOMER_NOTIFICATION":
        const { items, totalAmount, customerName } = payload;
        
        html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 650px; margin: auto; background-color: #f9f9f9; border: 1px solid #ddd;">
                <h2 style="color: #333;">Hi ${customerName},</h2>
                <p style="font-size: 16px; color: #555;">
                    Thank you for Order! 🎉<br/>
                    Your order has been successfully placed.
                </p>

                <h3 style="margin-top: 20px; color: #333;">Order Summary</h3>
                <table cellpadding="10" cellspacing="0" border="1" 
                    style="border-collapse: collapse; width:100%; margin:15px 0; font-size:14px; text-align:left; background:#fff;">
                    <thead style="background-color:#f8f9fa;">
                        <tr>
                            <th style="border:1px solid #ddd;">Product</th>
                            <th style="border:1px solid #ddd;">Quantity</th>
                            <th style="border:1px solid #ddd;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(i => `
                            <tr>
                                <td style="border:1px solid #ddd;">${i.productName}</td>
                                <td style="border:1px solid #ddd;">${i.quantity}</td>
                                <td style="border:1px solid #ddd;">₦${Number(i.price).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <p style="font-size: 16px; color: #333; font-weight: bold;">
                    Total: ₦${Number(totalAmount).toLocaleString()}
                </p>


                <p style="font-size: 15px; color: #555; margin-top: 25px;">
                    We’ll notify you once your items are shipped. You can track your order from your dashboard.
                </p>

                <p style="font-size: 14px; color: #888;">
                    – The Team
                </p>
            </div>
        `;
        subject = subject || `Order Confirmation `;
        break;

    case "ORDER_VENDOR_NOTIFICATION":
        const { businessName, vitems, total } = payload;

        html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 650px; margin: auto; background-color: #ffffff; border: 1px solid #ddd;">
                <h2 style="color: #333;">Hello ${businessName},</h2>
                <p style="font-size: 16px; color: #555;">
                    🎉 Great news! You have received a new order containing your product${vitems.length > 1 ? 's' : ''}.
                </p>

                <h3 style="margin-top: 20px; color: #333;">Order Details</h3>

                <table cellpadding="10" cellspacing="0" border="1" 
                    style="border-collapse: collapse; width:100%; margin:15px 0; font-size:14px; text-align:left; background:#fff;">
                    <thead style="background-color:#f8f9fa;">
                        <tr>
                            <th style="border:1px solid #ddd;">Product</th>
                            <th style="border:1px solid #ddd;">Quantity</th>
                            <th style="border:1px solid #ddd;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${vitems.map(i => `
                            <tr>
                                <td style="border:1px solid #ddd;">${i.productName}</td>
                                <td style="border:1px solid #ddd;">${i.quantity}</td>
                                <td style="border:1px solid #ddd;">₦${i.price.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <p style="font-size: 16px; color: #333; font-weight: bold;">
                    Subtotal for this order: ₦${total.toLocaleString()}
                </p>

                <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; border: 1px solid #c8e6c9; margin: 15px 0;">
                    <p style="margin: 0; font-size: 15px; color: #2e7d32;">
                        ✅ Please prepare the above items for shipping. You’ll receive another email once the order is ready for pickup or delivery.
                    </p>
                </div>

                <p style="font-size: 14px; color: #888; margin-top: 25px;">
                    Thank you for being part of our marketplace.<br/>
                    – The Team
                </p>
            </div>
        `;
        subject = subject || `New Order Received `;
        break;


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