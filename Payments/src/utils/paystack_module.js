import logger from "./logger.js";
import paystack from "./paystack.js";

class PaystackServices {
    static async initializePayment({ email, amount, reference, split_code, metadata={}}) {
        try {
            const payload = {
                email,
                amount: Math.round(amount * 100),
                reference,
                metadata,
                split_code
            }

            const res = await paystack.post("/transaction/initialize", payload)
            return res.data.data
        } catch (error) {
            logger.error(
                "Error initializing Paystack payment",{
                    status: error.response?.status,
                    data: error.response?.data,
                }
            )
            throw error
        }
    }

    static async createSplit(vendorsBreakdown) {
        try {
            const total = vendorsBreakdown.reduce((sum, v) => sum + v.amount, 0);

            const splitData = {
                name: `ORDER_SPLIT_${Date.now()}`,
                type: "percentage",
                currency: "NGN",
                subaccounts: vendorsBreakdown.map(vendor => ({
                    subaccount: vendor.subaccount_code,
                    share: parseFloat(((vendor.amount / total) * 100).toFixed(2)),
                })),
                bearer_type: "subaccount", // or "subaccount" depending on who pays fees
                bearer_subaccount: vendorsBreakdown[0].subaccount_code
            };

            const res = await paystack.post("/split", splitData);
            logger.info("✅ Created Paystack split successfully", res.data.data);
            return res.data.data; // contains split_code
        } catch (error) {
            logger.error("Error creating Paystack split", {
                data: error.response?.data,
                status: error.response?.status,
            });
            throw error;
        }
    }

    static async verifyPayment(reference) {
        const response = await paystack.get(`/transaction/verify/${reference}`);
        return response.data.data;
    }
}

export default PaystackServices