import express from 'express';
import { listArtists, getArtist, getArtistSongs, getArtistAlbums } from '../controllers/artistController.js';

const artistRouter = express.Router();

artistRouter.get('/', listArtists);
artistRouter.get('/:id', getArtist);
artistRouter.get('/:id/songs', getArtistSongs);
artistRouter.get('/:id/albums', getArtistAlbums);

export default artistRouter;
