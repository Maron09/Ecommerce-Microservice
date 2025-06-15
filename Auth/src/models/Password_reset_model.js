import mongoose  from "mongoose";


const { Schema, model } = mongoose;

const PasswordResetCodeSchema = new Schema({
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
    used:{
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });


const PasswordResetCode = model("PasswordResetCode", PasswordResetCodeSchema);

export default PasswordResetCode;