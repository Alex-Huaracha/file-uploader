import { Router } from 'express';
import { uploadFile } from '../controllers/file.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js'; // <-- IMPORTA MULTER

const router = Router();

router.post(
  '/files/upload',
  isAuthenticated,
  upload.single('file'),
  uploadFile
);

export default router;
