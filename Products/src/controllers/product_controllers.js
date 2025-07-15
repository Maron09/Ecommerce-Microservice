import ApprovedVendors from "../models/approved_vendors.js";
import Product from "../models/product.js";
import logger from "../utils/logger.js";
import withTransaction from "../helpers/transactions.js";
import CloudinaryServices from "../utils/cloudinary.js";



class ProductControllers {
    static async createProduct(req, res) {
        logger.info("Create product endpoint...")

        if (!req.user || req.user?.role !== "vendor") {
            logger.warn("Unauthorized access attempt to createProduct")
            return res.status(403).json({
                success: false,
                message: "Access Denied. Vendor only."
            });
        }

        try {
            return withTransaction(async (session) => {
                const userId = req.user.userId
                const approvedVendor = await ApprovedVendors.findOne({ userId: userId }, null, { session })
                if (!approvedVendor) {
                    logger.warn("Unauthorized access attempt to createProduct")
                    return res.status(403).json({
                        success: false,
                        message: "Access Denied. Vendor not approved."
                    });
                }
                const { productName, description, price, stock } = req.body
                if (!productName || !price || !stock) {
                    logger.warn("Missing required product fields", { productName, description, price, stock });
                    return res.status(400).json({
                        success: false,
                        message: "Missing required product fields"
                    });
                }

                const images = await CloudinaryServices.uploadProductImages(req.files)

                const newProduct = await Product.create([{
                    userId: userId,
                    vendorId: approvedVendor.vendorId,
                    productName,
                    description,
                    price,
                    stock,
                    images: images.map(image => ({
                        originalName: image.originalname,
                        publicId: image.public_id,
                        secureUrl: image.secure_url
                    })),
                    status: "ACTIVE"
                }], { session });

                logger.info("Product created successfully", { productId: newProduct[0]._id });
                return res.status(201).json({
                    success: true,
                    message: "Product created successfully",
                    data: newProduct[0]
                });
            })
        } catch (error) {
            logger.error("Error creating product", { error: error.stack || error.message });
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
        
    }
}


export default ProductControllers;