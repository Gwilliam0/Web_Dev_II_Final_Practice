import multer from 'multer';
import { extname, join } from 'node:path';

const __dirname = import.meta.dirname;

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = join(__dirname, '../../upload');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File type filter
const fileFilter = (req, file, cb) => {
  console.log('MIME type:', file.mimetype);
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'application/pdf'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

// Upload middleware
const uploadMiddleware = multer({
  storage,
  //fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10MB
    files: 5                      // Maximum 5 files
  }
});

export default uploadMiddleware;