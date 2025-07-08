import mongoose from "mongoose";


const { Schema, model } = mongoose

const vendorWalletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        unique: true,
        ref: "User"
    },
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: "Vendor"
    },
    balance: {
        type: Number,
        default: 0.0
    },
    currency: {
        type: String,
        default: "NGN"
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })


const VendorWallet = model("VendorWallet", vendorWalletSchema)


export default VendorWallet