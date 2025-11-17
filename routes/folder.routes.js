import { Router } from 'express';
import {
  postFolder,
  getFolderById,
  deleteFolder,
} from '../controllers/folder.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/folders', isAuthenticated, postFolder);
router.get('/folders/:id', isAuthenticated, getFolderById);
router.post('/folders/:id/delete', isAuthenticated, deleteFolder);

export default router;
