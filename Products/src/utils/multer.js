import multer from 'multer';
import logger from './logger.js';

const storage = multer.memoryStorage(); // Store files in memory

const multerOptions = {
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png/;
        const isValidType = allowedTypes.test(file.mimetype.toLowerCase()) && allowedTypes.test(file.originalname.toLowerCase());
        if (isValidType) {
            cb(null, true);
        } else {
            logger.error("Invalid file type uploaded", { mimetype: file.mimetype });
            cb(new Error('Only JPEG, JPG, and PNG files are allowed'));
        }
    }
}

function uploadMultipleImages(fieldName, maxCount = 5) {
    return (req, res, next) => {
        const upload = multer(multerOptions).array(fieldName, maxCount);
        upload(req, res, (err) => {
            if (err) {
                logger.error("Error uploading files", { error: err.stack });
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No files uploaded"
                });
            }
            logger.info("Files uploaded successfully", { count: req.files.length });
            next();
        });
    }
}


export default uploadMultipleImages;