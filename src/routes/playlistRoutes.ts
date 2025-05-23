import { Router } from 'express';
import { generatePlaylist, mixPlaylist, autoChangeSongs, stopAutoChange, generatePersonalizedPlaylist, generatePlaylistOnJoin } from '../controllers/playlistController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/generate', authenticateJWT, generatePlaylist);
router.post('/:eventId/personalize', authenticateJWT, generatePersonalizedPlaylist);
router.post('/:eventId/join', authenticateJWT, generatePlaylistOnJoin);
router.post('/:eventId/mix', authenticateJWT, mixPlaylist);
router.post('/:eventId/auto-change', authenticateJWT, autoChangeSongs);
router.post('/:eventId/stop-auto-change', authenticateJWT, stopAutoChange);

export default router; 