import { Router } from 'express';
import {
  postFolder,
  getFolderById,
  deleteFolder,
  renameFolder,
} from '../controllers/folder.controller.js';
import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/folders', isAuthenticated, postFolder);
router.get('/folders/:id', isAuthenticated, getFolderById);
router.post('/folders/:id/delete', isAuthenticated, deleteFolder);
router.post('/folders/:id/update', isAuthenticated, renameFolder);

export default router;
