import mongoose from 'mongoose';


const { Schema, model } = mongoose

const approvedVendorSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    vendorId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    businessName: {
        type: String,
        required: true,
        trim: true
    },
    isApproved: {
        type: Boolean
    },
    approvedAt: {
        type: Date,
        default: Date.now
    }
})


const ApprovedVendors = model('ApprovedVendors', approvedVendorSchema)

export default ApprovedVendors;