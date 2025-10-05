import mongoose from "mongoose";


const {  Schema, model } = mongoose;

const cartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    inventoryCode: {
        type: String,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    }
}, { _id: false });

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true, 
    },
    items: [cartItemSchema],
    updatedAt: {
        type: Date,
        default: Date.now,
    }
}, { timestamps: true });

const Cart = model("Cart", cartSchema);

export default Cart;
