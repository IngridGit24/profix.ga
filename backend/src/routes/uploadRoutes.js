import express from 'express';
import uploadController from '../controllers/uploadController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// Authenticated only — this is exactly the gate the old unsigned Cloudinary
// preset didn't have.
router.get('/signature', authenticateToken, uploadController.getSignature);

export default router;
