import mongoose from "mongoose";

const { Schema, model} = mongoose;


const ProductSchema = new Schema ({
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
    inventoryCode: {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
    },
})

const Products = model("Product", ProductSchema);

export default Products;