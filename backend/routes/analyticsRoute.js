import express from 'express';
import {
    getGenreDistribution,
    getTopSongs,
    getTopArtists,
    getListeningStats,
    getActiveUsers,
} from '../controllers/analyticsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const analyticsRouter = express.Router();

analyticsRouter.get('/genres', getGenreDistribution);
analyticsRouter.get('/top-songs', getTopSongs);
analyticsRouter.get('/top-artists', getTopArtists);
analyticsRouter.get('/listening', authMiddleware, getListeningStats);
analyticsRouter.get('/active-users', getActiveUsers);

export default analyticsRouter;
