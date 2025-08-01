import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadBills } from '../controllers/uploadController.js';

const router = express.Router();

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define storage for multer. This should ideally be defined once and imported,
// but for clarity within this file, we keep it here.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the uploads directory exists at the root of the backend project
    const uploadPath = path.join(__dirname, '..', '..', 'uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using timestamp and original name
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Create the multer upload instance
const upload = multer({ storage: storage });

// Route for uploading multiple bills.
// The `upload.array('bills')` middleware will process the files before `uploadBills` controller is called.
router.post('/bills', upload.array('bills'), uploadBills);

export default router;
