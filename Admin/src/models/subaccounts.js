import mongoose from "mongoose";

const { Schema, model } = mongoose


const subAccountSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        unique: true,
        ref: "User"
    },
    vendorId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Vendor"
    },
    bankName: {
        type: String,
        required: true,
    },
    bankCode: {
        type: String,
        required: true,
    },
    subaccountCode: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const SubAccounts = model("SubAccounts", subAccountSchema)


export default SubAccounts