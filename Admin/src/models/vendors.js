import mongoose from "mongoose";


const { Schema, model } = mongoose;

const vendorSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: "Vendor",
        required: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    businessName: {
        type: String,
        trim: true,
    },
    avatar: {
        secureUrl: {
            type: String,
        }
    },
    isApproved:{
        type: Boolean,
    }
}, {timestamps: true});


const Vendors = model("Vendor", vendorSchema);

export default Vendors;