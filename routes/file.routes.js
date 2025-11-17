import { Router } from 'express';
import {
  uploadFile,
  getFileDetails,
  downloadFile,
  deleteFile,
} from '../controllers/file.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = Router();

// Upload file
router.post(
  '/files/upload',
  isAuthenticated,
  upload.single('file'),
  uploadFile
);

// Get file details
router.get('/files/:id', isAuthenticated, getFileDetails);

// Download file
router.get('/files/:id/download', isAuthenticated, downloadFile);

// Delete file
router.post('/files/:id/delete', isAuthenticated, deleteFile);

export default router;
