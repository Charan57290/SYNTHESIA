import express from 'express';
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
} from '../controllers/playlistController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const playlistRouter = express.Router();

playlistRouter.use(authMiddleware);

playlistRouter.post('/', createPlaylist);
playlistRouter.get('/', getUserPlaylists);
playlistRouter.get('/:id', getPlaylist);
playlistRouter.post('/:id/songs', addSongToPlaylist);
playlistRouter.delete('/:id/songs/:songId', removeSongFromPlaylist);

export default playlistRouter;
