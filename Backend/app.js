// D:\ValueDX\Bill Reimbursement\reimburse_fb\reimbapp_backend\app.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix the import paths to be relative to the 'reimbapp_backend' directory
import reimbursementRoutes from './routes/reimbursementRoutes.js'; // Changed from '../routes/reimbursementRoutes.js' or incorrect path
import authRoutes from './routes/authRoutes.js'; // Changed from '../routes/authRoutes.js' or incorrect path
import uploadRoutes from './routes/uploadRoutes.js'; // Changed from '../routes/uploadRoutes.js' or incorrect path

const app = express();
const PORT = 3001;

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/upload', uploadRoutes);

// Basic route for testing server
app.get('/', (req, res) => {
  res.send('Reimbursement Backend API is running!');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});