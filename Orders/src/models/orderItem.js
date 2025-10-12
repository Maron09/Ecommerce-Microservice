import mongoose from "mongoose";


const { Schema, model } = mongoose;

const orderItemSchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    productId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    price : {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
    },
    total : {
        type: Number,
        required: true
    }
}, {timestamps: true});

const OrderItem = model("OrderItem", orderItemSchema);

export default OrderItem;