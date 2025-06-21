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

function createUploadHandler(fieldName) {
    return (req, res, next) => {
        const upload = multer(multerOptions).single(fieldName);
        upload(req, res, (err) => {
            if (err) {
                logger.error("Error during file upload", { error: err.stack });
                return res.status(400).json({ error: err.message });
            }
            if (!req.file) {
                logger.warn("No file uploaded");
                return res.status(400).json({ error: 'No file uploaded' });
            }
            logger.info("File uploaded successfully", { fieldName, filename: req.file.originalname });
            next();
        });
    }
}


export default createUploadHandler;