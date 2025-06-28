import mongoose from "mongoose";


const { Schema, model } = mongoose;

const customerSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
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
    avatar: {
        secureUrl: {
            type: String,
        }
    },
}, {timestamps: true});


const Customers = model("Customer", customerSchema);

export default Customers;