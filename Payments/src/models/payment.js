import mongoose from "mongoose";

const { Schema, model } = mongoose;

const paymentSchema = new Schema({
    orderId: { type: String, required: true, index: true },
    customerId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    paystackReference: { type: String, sparse: true },
    paystackAccessCode: { type: String, sparse: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'success', 'failed', 'cancelled'],
        default: 'pending',
    },
    paymentMethod: { type: String, default: 'paystack' },
    vendorsBreakdown: [
        {
        vendorId: String,
        amount: Number,
        status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
        subaccount_code: String,
        },
    ],
    metadata: {
        items: Array,
        customerEmail: String,
        customerName: String,
    },
}, { timestamps: true });


const Payment = model("Payment", paymentSchema);

export default Payment;