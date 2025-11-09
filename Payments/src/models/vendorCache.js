import mongoose from "mongoose";

const { Schema, model } = mongoose;

const vendorCacheSchema = new Schema({
    userId :{
        type: String,
        required: true,
    },
    vendorId :{
        type: String,
        required: true,
    },
    businessName: {
        type: String,
        required: true,
    },
    email : {
        type: String,
        required: true,
    },
    subaccountCode: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const VendorCache = model("VendorCache", vendorCacheSchema);

export default VendorCache;