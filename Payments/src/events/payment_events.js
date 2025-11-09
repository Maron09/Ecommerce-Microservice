import logger from "../utils/logger.js";
import withTransaction from "../helpers/transactions.js";
import VendorCache from "../models/vendorCache.js";
import CustomerCache from "../models/customerCache.js";
import Payment from "../models/payment.js";

class PaymentEvents {
    static async onVendorSubaccountCreated(data) {
        if (!data?.userId || !data?.vendorId || !data?.businessName || !data?.email || !data?.subaccountCode) {
            logger.error("Invalid data received for vendor cache creation", data);
            throw new Error("Invalid data for vendor cache creation");
        }

        logger.info("Received vendor subaccount created event", data);
        return await withTransaction(async (session) => {
            const exist = await VendorCache.findOne({ userId: data.userId }, null, { session })
            if (exist) return

            logger.info("Creating new vendor cache...");
            await VendorCache.create([{
                userId: data.userId,
                vendorId: data.vendorId,
                businessName: data.businessName,
                email: data.email,
                subaccountCode: data.subaccountCode,
            }], { session })
        })
    }

    static async onCustomerCreated(data){
        if(!data?.userId || !data?.firstName || !data?.lastName || !data?.email || !data?.customerId){ 
            logger.error("Invalid data received for customer cache creation", data);
            throw new Error("Invalid data for customer cache creation");
        }

        logger.info("Received customer created event", data);
        return await withTransaction(async (session) => {
            const exist = await CustomerCache.findOne({ userId: data.userId }, null, { session })
            if (exist) return

            logger.info("Creating new customer cache...");
            await CustomerCache.create([{
                userId: data.userId,
                customerId: data.customerId,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
            }], { session })
        })
    }

    static async onProcessPayment(data) {
        if (!data?.userId || !data?.orderId || !data?.amount || !data?.items) {
            logger.error("Invalid data received for payment processing", data);
            throw new Error("Invalid data for payment processing");
        }

        logger.info("Received process payment event", data);

        return await withTransaction(async (session) => {
            logger.info("Creating new payment record...");

            const customer = await CustomerCache.findOne({ userId: data.userId }, null, { session });
            if (!customer) {
                logger.error("Customer cache not found for user", { userId: data.userId });
                throw new Error("Customer cache not found");
            }

            const vendors = await VendorCache.find({ vendorId: { $in: data.vendorIds } }, null, { session });
            if (!vendors || vendors.length === 0) {
                logger.error("Vendor cache not found for vendors", { vendorIds: data.vendorIds });
                throw new Error("Vendor cache not found");
            }

            // 🔹 Build vendors breakdown
            const vendorsBreakdown = vendors.map((vendor) => {
                // Calculate vendor’s total amount
                const vendorItems = data.items.filter(item => item.vendorId === vendor.vendorId);
                const vendorTotal = vendorItems.reduce((sum, item) => sum + (item.total || 0), 0);

                return {
                    vendorId: vendor.vendorId,
                    amount: vendorTotal,
                    status: 'unpaid',
                    subaccount_code: vendor.subaccountCode
                };
            });

            // 🔹 Calculate overall total (double-check consistency)
            const totalAmount = vendorsBreakdown.reduce((sum, v) => sum + v.amount, 0);

            // 🔹 Create a single payment document
            const payment = new Payment({
                orderId: data.orderId,
                customerId: customer.customerId,
                amount: totalAmount || data.amount, // fallback if amounts missing
                currency: data.currency || "NGN",
                status: 'pending',
                paymentMethod: data.paymentMethod || 'paystack',
                vendorsBreakdown,
                metadata: {
                    items: data.items,
                    customerEmail: customer.email,
                    customerName: `${customer.firstName} ${customer.lastName}`,
                },
            });

            await payment.save({ session });

            logger.info("✅ Payment record created successfully", { orderId: data.orderId, totalAmount });
            return payment;
        });
    }

}


export default PaymentEvents;