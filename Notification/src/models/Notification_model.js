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
        enum: ["VERIFICATION", "RESET_PASSWORD", "WELCOME", "ORDER_CONFIRMATION"],
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
    }
}, {
    timestamps: true
});


const Notification = model("Notification", NotificationSchema);


export default Notification;
