import express from 'express';
import { addSong, listSong, removeSong } from '../controllers/songController.js';
import upload from '../middleware/multer.js';
import songModel from '../models/songModel.js';

const songRouter = express.Router();

songRouter.post('/add', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), addSong);
songRouter.get('/list', listSong);
songRouter.post('/remove', removeSong);

// Search songs by name or desc
songRouter.get('/search', async (req, res) => {
    try {
        const q = req.query.q || '';
        const regex = new RegExp(q, 'i');
        const songs = await songModel.find({ $or: [{ name: regex }, { desc: regex }] });
        res.json({ success: true, songs });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error searching songs' });
    }
});

// Top 20 songs by playCount
songRouter.get('/popular', async (req, res) => {
    try {
        const songs = await songModel.find({}).sort({ playCount: -1 }).limit(20);
        res.json({ success: true, songs });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching popular songs' });
    }
});

// Songs by genre
songRouter.get('/genre/:genre', async (req, res) => {
    try {
        const songs = await songModel.find({ genre: req.params.genre });
        res.json({ success: true, songs });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching songs by genre' });
    }
});

export default songRouter;
