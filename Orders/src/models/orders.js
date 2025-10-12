import mongoose from "mongoose";


const { Schema, model } = mongoose;

const orderSchema = new Schema({
    userId : {
        type: Schema.Types.ObjectId,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
    },
    orderStatus: {
        type: String,
        enum: ["processing", "shipped", "delivered", "cancelled"],
        default: "pending",
    },
    deliveryAddress: {
        type: Object,
    },
    paymentMethod: {
        type: String,
    },
    placedAt: {
        type: Date,
        default: Date.now
    },
}, {timestamps: true});

const Order = model("Order", orderSchema);

export default Order;