import logger from "../utils/logger.js";
import Payment from "../models/payment.js";
import PaystackServices from "../utils/paystack_module.js";
import CustomerCache from "../models/customerCache.js";
import rabbitMQClient from "../utils/rabbit.js";


class PaymentControllers {
    static async initializePayment(req, res) {
        logger.info("Initializing payment...");
        const { orderId } = req.params;
        const userId = req.user?.userId || req.user?.id;
        try {
            const customer = await CustomerCache.findOne({ userId });
            if (!customer) {
                logger.error("Customer not found");
                return res.status(404).json({
                    success: false,
                    message: "Customer not found"
                });
            }
            const payment = await Payment.findOne({ orderId, customerId: customer.customerId })
            if (!payment) {
                logger.error("Payment record not found");
                return res.status(404).json({
                    success: false,
                    message: "Payment record not found"
                });
            }
            if (payment.status === "success") {
                logger.info("Payment already completed", { orderId });
                return res.status(200).json({
                    success: true,
                    message: "Payment already completed",
                    data: payment
                });
            }

            const metadata = {
                orderId: payment.orderId,
                customerId: payment.customerId,
                vendorBreakdown: payment.vendorsBreakdown,
                customerEmail: customer.email,
                customerName: `${customer.firstName} ${customer.lastName}`,
                items: payment.metadata.items,
            }

            const split = await PaystackServices.createSplit(payment.vendorsBreakdown)
            const reference = `ORD-${orderId}-PAY-${Date.now()}`
            const paystackResponse = await PaystackServices.initializePayment({
                email: customer.email,
                amount: payment.amount,
                reference,
                metadata,
                split_code: split.split_code
            })
            payment.paystackReference = reference
            payment.paystackAccessCode = paystackResponse.access_code
            payment.status = "processing"
            await payment.save()
            logger.info("Payment initialized successfully", { orderId, reference });

            return res.status(200).json({
                success: true,
                message: "Payment initiated successfully",
                authorizationUrl: paystackResponse.authorization_url,
                access_code: paystackResponse.access_code,
                reference,
            })
        }catch (error) {
            logger.error("Error initializing payment", { error: error.stack });
            return res.status(500).json({
                success: false,
                message: "Server Error"
            });
        }
    }

    static async verifyPayment(req, res) {
        const { reference } = req.query;

        if (!reference) {
            return res.status(400).json({
                success: false,
                message: "Payment reference is required",
            });
        }

        try {
            logger.info("Verifying payment...", { reference });

            // Fetch payment record first
            const payment = await Payment.findOne({ paystackReference: reference });
            if (!payment) {
                logger.error("Payment not found for reference", { reference });
                return res.status(404).json({
                    success: false,
                    message: "Payment not found",
                });
            }

            // If already marked success, return immediately (idempotent)
            if (payment.status === "success") {
                logger.info("Payment already verified", { reference, orderId: payment.orderId });
                return res.status(200).json({
                    success: true,
                    message: "Payment already verified",
                    data: payment,
                });
            }

            // Verify with Paystack
            const result = await PaystackServices.verifyPayment(reference);

            if (result.status === "success") {
                // Update payment and vendorsBreakdown atomically
                payment.status = "success";
                payment.vendorsBreakdown = payment.vendorsBreakdown.map(v => ({
                    ...v,
                    status: "paid",
                }));
                await payment.save();

                // Publish event
                await rabbitMQClient.publish("payment.verified", {
                    orderId: payment.orderId,
                    status: payment.status,
                });

                logger.info("✅ Payment verified successfully", { reference, orderId: payment.orderId });
                return res.status(200).json({
                    success: true,
                    message: "Payment verified successfully",
                    data: payment,
                });
            }

            // Payment not successful
            logger.warn("Payment verification failed", { reference, result });
            return res.status(400).json({
                success: false,
                message: "Payment not successful or still pending",
                data: result,
            });
        } catch (error) {
            logger.error("Error verifying payment", { error: error.message, reference });
            return res.status(500).json({
                success: false,
                message: "Payment verification failed",
            });
        }
    }


}

export default PaymentControllers;