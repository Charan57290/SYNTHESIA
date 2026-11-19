import express from 'express';
import { importMusicHandler, getImportStatus } from '../controllers/adminController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const adminRouter = express.Router();

adminRouter.use(authMiddleware);

adminRouter.post('/import/music', importMusicHandler);
adminRouter.get('/import/status', getImportStatus);

export default adminRouter;
