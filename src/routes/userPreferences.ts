import { Router } from 'express';
import { 
  saveFavoriteSong,
  getUserFavorites,
  getChatGPTInteractions
} from '../controllers/userPreferencesController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// Favorite songs routes
router.post('/favorites', saveFavoriteSong);
router.get('/favorites', getUserFavorites);

// ChatGPT and playlist generation routes
router.get('/chatgpt-interactions', getChatGPTInteractions);

export default router; 