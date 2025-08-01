import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure the uploads directory exists
    const uploadPath = path.join(__dirname, '..', '..', 'uploads'); // Go up two levels to the root of the backend
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Create the multer upload instance
const upload = multer({ storage: storage });

// Controller function for handling file uploads
export const uploadBills = (req, res) => {
  // `upload.array('bills')` middleware has already processed the files
  // Files are available in req.files
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded.' });
  }

  const files = req.files.map(file => ({
    name: file.originalname,
    // The URL should be relative to where the static files are served
    url: `/uploads/${file.filename}`,
    type: file.mimetype
  }));

  console.log('Files uploaded:', files);
  res.status(200).json({ success: true, files });
};
