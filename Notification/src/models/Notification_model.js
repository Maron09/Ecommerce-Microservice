// models/Notification.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const NotificationSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["VERIFICATION", "RESEND_OTP", "FORGOT_PASSWORD", "APPROVED", "RESET_PASSWORD", "WELCOME", "ORDER_CONFIRMATION", "LOW_INVENTORY"],
        required: true
    },
    payload: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        enum: ["PENDING", "SENT", "FAILED"],
        default: "PENDING"
    },
    attempts: {
        type: Number,
        default: 0
    },
    errorMessage: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: "15m" }
    },
}, {
    timestamps: true
});


const Notification = model("Notification", NotificationSchema);


export default Notification;
