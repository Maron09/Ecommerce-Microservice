import mongoose from "mongoose";

const { Schema, model } = mongoose;

const inventorySchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    vendorId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    businessName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    inventoryCode: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
    lowStockAlertSent: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });
const Inventory = model("Inventory", inventorySchema);
export default Inventory;
