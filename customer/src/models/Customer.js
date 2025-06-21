import mongoose from "mongoose";


const { Schema, model } = mongoose;

const CustomerSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
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
        validate: {
            validator: function(v) {
                return /^\+?[1-9]\d{9,13}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    avatar: {
        originalName: {
            type: String
        },
        publicId: {
            type: String,
            required: true
        },
        secureUrl: {
            type: String,
            required: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {timestamps: true});

const Customer = model("Customer", CustomerSchema);

export default Customer;