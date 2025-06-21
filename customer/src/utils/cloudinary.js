import cloudinary from 'cloudinary';
import logger from './logger.js';
import "../helpers/env.js";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})


class CloudinaryServices {
    static async uploadProfilePicture(file) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream({
                folder: 'profile_pictures',
                allowed_formats: ['jpg', 'jpeg', 'png'],
                transformation: [
                    { width: 300, height: 300, crop: 'limit' },
                    { quality: 'auto', fetch_format: 'auto' }
                ],
            }, (error, result) => {
                if (error) {
                    logger.error("Error uploading profile picture to Cloudinary", error);
                    return reject(new Error("Failed to upload profile picture"));
                }
                logger.info("Profile picture uploaded successfully to Cloudinary");
                resolve(result);
            });

            uploadStream.end(file.buffer); // Pipe the file into the upload stream
        });
    }

    static async deleteImage(publicId) {
        try {
            const result = await cloudinary.v2.uploader.destroy(publicId)
            if (!publicId) {
                logger.warn("No publicId provided for image deletion");
                throw new Error("Invalid publicId");
            }

            if (result.result === 'ok') {
                logger.info("Image deleted successfully from Cloudinary", { publicId });
                return true;
            } else {
                logger.error("Failed to delete image from Cloudinary", { publicId, result });
                throw new Error("Failed to delete image");
            }
        }catch (error) {
            logger.error("Error deleting image from Cloudinary", { publicId, error: error.stack || error.message });
            throw new Error("Failed to delete image");
        }
    }
}


export default CloudinaryServices;