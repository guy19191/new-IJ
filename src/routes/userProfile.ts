import { Router } from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userProfileController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Profile routes
router.get('/me', getUserProfile);
router.put('/me', updateUserProfile);

export default router; 