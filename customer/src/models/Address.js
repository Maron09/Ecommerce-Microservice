import mongoose from 'mongoose';


const { Schema, model } = mongoose;


const addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    label: {
        type: String,
        required: true,
        trim: true,
        enum: ['Home', 'Work', 'Other']
    },
    street: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    postalCode: {
        type: String,
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

const Address = model('Address', addressSchema);

export default Address;