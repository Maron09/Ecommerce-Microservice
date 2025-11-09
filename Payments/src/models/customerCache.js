import mongoose from "mongoose";

const { Schema, model } = mongoose;

const customerCacheSchema = new Schema({
    userId :{
        type: String,
        required: true,
    },
    customerId: {
        type: String,
        required: true,
    },
    email : {
        type: String,
        required: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
}, { timestamps: true });


const CustomerCache = model("CustomerCache", customerCacheSchema);

export default CustomerCache;
