import mongoose  from "mongoose";


const { Schema, model } = mongoose;

const VerificationCodeSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    code: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ["email", "phone"],
        default: "email",
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    verified:{
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VerificationCode = model("VerificationCode", VerificationCodeSchema);

export default VerificationCode;