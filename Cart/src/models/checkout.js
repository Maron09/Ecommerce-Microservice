import mongoose from "mongoose";


const { Schema, model } = mongoose;

const checkoutSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    cartSnapShot: {
        type: Object,
        required: true,
    },
    total: {
        type: Number,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {timestamps: true});

checkoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const CheckoutPage = model("checkout", checkoutSchema)

export default CheckoutPage