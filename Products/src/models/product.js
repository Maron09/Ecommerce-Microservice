import mongoose from "mongoose";


const { Schema, model } = mongoose;

const productSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true },
    vendorId: { type: Schema.Types.ObjectId, required: true },
    
    productName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },

    images: [{
        originalName: {
            type: String
        },
        publicId: {
            type: String,
            required: false
        },
        secureUrl: {
            type: String,
            required: false
        }
    }],
    inventoryCode: {
        type: String,
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "DRAFT", "BLOCKED"],
        default: "DRAFT"
    },

    isDeleted: {
        type: Boolean,
        default: false
    },

}, { timestamps: true });

productSchema.index({ vendorId: 1 });

const Product = model("Product", productSchema);

export default Product;
