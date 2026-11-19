import express from 'express';
import { recordPlay, getHistory, getRecentHistory } from '../controllers/playHistoryController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const historyRouter = express.Router();

historyRouter.use(authMiddleware);

historyRouter.post('/', recordPlay);
historyRouter.get('/recent', getRecentHistory);
historyRouter.get('/', getHistory);

export default historyRouter;
