import ApprovedVendors from "../models/approved_vendors.js";
import Product from "../models/product.js";
import logger from "../utils/logger.js";
import withTransaction from "../helpers/transactions.js";
import CloudinaryServices from "../utils/cloudinary.js";
import paginationResults from "../helpers/pagination.js";
import { buildPaginatedResponse } from "../helpers/paginatonResponse.js";
import invalidateProductCache from "../utils/cache.js";
import generateInventoryCode from "../utils/inventory.js";
import rabbitMQClient from "../utils/rabbit.js";



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
                        originalName: image.originalName,
                        publicId: image.public_id,
                        secureUrl: image.secure_url
                    })),
                    status: "ACTIVE"
                }], { session });
                const inventoryCode = generateInventoryCode(newProduct[0]._id);
                newProduct[0].inventoryCode = inventoryCode;
                await newProduct[0].save({session});

                await rabbitMQClient.publish("product.created", {
                    productId: newProduct[0]._id,
                    productName: newProduct[0].productName,
                    businessName: approvedVendor.businessName,
                    vendorId: approvedVendor.vendorId,
                    email: approvedVendor.email,
                    inventoryCode: newProduct[0].inventoryCode,
                    stock: newProduct[0].stock,
                })

                const totalPosts = await Product.countDocuments({ status: "ACTIVE" }).session(session);
                const totalPages = Math.ceil(totalPosts / 10); // Assuming 10 items per page
                for (let page = 1; page <= totalPages; page++) {
                    await invalidateProductCache(req, page, 10);
                }

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

    static async deleteProductImagesById(req, res) {
        const { productId } = req.params
        const { imageIds } = req.body

        logger.info("Delete Product Images...", { productId, imageIds });
        if (!Array.isArray(imageIds) || imageIds.length === 0) {
            logger.warn("No image IDs provided for deletion", { productId, imageIds });
            return res.status(400).json({
                success: false,
                message: "No image IDs provided for deletion"
            });
        }

        try {
            return withTransaction(async (session) => {
                const userId = req.user.userId
                const product = await Product.findOne({ _id: productId }).session(session)
                if (!product) {
                    logger.warn("Product not found", product)
                    return res.status(404).json({
                        success: false,
                        message: "Product not found"
                    })
                }
                if (product.userId.toString() !== userId) {
                    logger.warn("Unauthorized access attempt to delete product images", { userId, productId });
                    return res.status(403).json({
                        success: false,
                        message: "Access Denied. You can only delete images from your own products."
                    });
                }
                const imagesToDelete = product.images.filter(image => imageIds.includes(image._id.toString()))

                if (imagesToDelete.length === 0) {
                    logger.warn("No matching images found for deletion", { productId, imageIds });
                    return res.status(404).json({
                        success: false,
                        message: "No matching images found for deletion"
                    });
                }
                for (const img of imagesToDelete) {
                    await CloudinaryServices.deleteImage(img.publicId)
                }
                product.images = product.images.filter(img => !imageIds.includes(img._id.toString()))

                await product.save(session)
                logger.info(`Deleted ${imagesToDelete.length} image(s) from product ${productId}`);
                return res.status(200).json({
                    success: true,
                    message: "Product images deleted successfully",
                    deleted: imagesToDelete.length,
                    deletedImages: imagesToDelete.map(i => i._id)
                });
            })
        } catch (error) {
            logger.error("Error deleting product images", {
                message: error.message,
                stack: error.stack
            });
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    static async updateProductImages(req, res) {
        const { productId } = req.params
        const userId = req.user.userId

        if (!userId) {
            logger.warn("User ID not found in request");
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        logger.info("Updating Product Images...", productId);

        try {
            return withTransaction(async (session) => {
                const product = await Product.findOne({ _id: productId }).session(session)
                if (!product) {
                    logger.warn("Product not found", { productId });
                    return res.status(404).json({
                        success: false,
                        message: "Product not found"
                    });
                }
                if (product.userId.toString() !== userId) {
                    logger.warn("Unauthorized access attempt to update product images", { userId, productId });
                    return res.status(403).json({
                        success: false,
                        message: "Access Denied. You can only update images for your own products."
                    });
                }
                if (!req.files || req.files.length === 0) {
                    logger.warn("No images provided for update", { productId });
                    return res.status(400).json({
                        success: false,
                        message: "No images provided for update"
                    });
                }
                const newImages = await CloudinaryServices.uploadProductImages(req.files)
                if (Array.isArray(product.images) && product.images.length > 0) {
                    for (const img of product.images) {
                        await CloudinaryServices.deleteImage(img.publicId);
                    }
                }
                if (newImages > 5) {
                    logger.warn("Too many images provided for update", { productId, count: newImages.length });
                    return res.status(400).json({
                        success: false,
                        message: "You can only upload up to 5 images at a time"
                    });
                }
                product.images = newImages.map(image => ({
                    originalName: image.originalName,
                    publicId: image.public_id,
                    secureUrl: image.secure_url
                }));

                await product.save(session);
                logger.info("Product images updated successfully", { productId });
                return res.status(200).json({
                    success: true,
                    message: "Product images updated successfully",
                    data: product.images
                });

            })
        } catch (error) {
            logger.error("Error updating product images", {
                message: error.message,
                stack: error.stack
            });
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    static async getProducts(req, res) {
        
        logger.info("Getting products...");
        try {
            const totalItems = await Product.countDocuments({ status: "ACTIVE" });
            const pagination = paginationResults(req, totalItems);
            const cacheKey = `posts:${pagination.page}:${pagination.limit}`;
            const cachedProducts = await req.redisClient.get(cacheKey);
            if (cachedProducts) {
                const productsFromCache = JSON.parse(cachedProducts);
                logger.info("Products retrieved from cache", { count: productsFromCache.length });
                return res.status(200).json(buildPaginatedResponse({
                    data: productsFromCache,
                    message: "Products retrieved successfully",
                    pagination,
                    dataKey: "products"
                }));
            }
            const products = await Product.find({ status: "ACTIVE" })
                .limit(pagination.limit)
                .skip(pagination.skip);
            if (!products || products.length === 0) {
                logger.warn("No products found");
                return res.status(404).json(buildPaginatedResponse({
                    data: [],
                    message: "No Products found",
                    pagination,
                    dataKey: "products"
                }));
            }
            logger.info("Products retrieved successfully", { count: products.length });
            await req.redisClient.setex(cacheKey, 3600, JSON.stringify(products)); // Cache for 1 hour
            return res.status(200).json(buildPaginatedResponse({
                data: products,
                message: "Products retrieved successfully",
                pagination,
                dataKey: "products"
            }))
        } catch (error) {
            logger.error("Error getting products", { error: error.stack || error.message });
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    static async getProductById(req, res) {
        const { productId } = req.params
        
        logger.info("Getting product by ID...", { productId });
        try {
            const product = await Product.findOne({ _id: productId, status: "ACTIVE" })
            if (!product) {
                logger.warn("Product not found", { productId });
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }
            logger.info("Product retrieved successfully", { productId });
            return res.status(200).json({
                success: true,
                message: "Product retrieved successfully",
                data: product
            });
        } catch (error) {
            logger.error("Error getting product by ID", { error: error.stack || error.message });
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

    static async updateProduct(req, res) {
        const { productId } = req.params;
        const updatedData = req.body;
        const userId = req.user.userId;

        if (!userId) {
            logger.warn("User ID not found in request");
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        logger.info("Updating Product...", { productId });

        try {
            return await withTransaction(async (session) => {
                const product = await Product.findOne({ _id: productId }).session(session);

                if (!product) {
                    logger.warn("Product not found", { productId });
                    return res.status(404).json({
                        success: false,
                        message: "Product not found"
                    });
                }

                if (product.userId.toString() !== userId) {
                    logger.warn("Unauthorized access attempt to update product", { userId, productId });
                    return res.status(403).json({
                        success: false,
                        message: "Access Denied. You can only update your own products."
                    });
                }

                // ✅ Only update allowed fields
                const allowedUpdates = ["productName", "description", "price", "stock", "status"];
                for (const key of Object.keys(updatedData)) {
                    if (allowedUpdates.includes(key)) {
                        product[key] = updatedData[key];
                    }
                }

                await product.save({ session });

                // ❓ cache invalidation (maybe optimize later)
                const totalProducts = await Product.countDocuments().session(session);
                const totalPages = Math.ceil(totalProducts / 10);
                for (let page = 1; page <= totalPages; page++) {
                    await invalidateProductCache(req, page, 10);
                }
                await rabbitMQClient.publish("product.updated", {
                    productId: product._id.toString(),
                    updatedValues: updatedData,
                })

                logger.info("Product updated successfully", { productId });
                return res.status(200).json({
                    success: true,
                    message: "Product updated successfully",
                    data: product
                });
            });
        } catch (error) {
            logger.error("Error updating product", { error: error.stack || error.message });
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }

}


export default ProductControllers;