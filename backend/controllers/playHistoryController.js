import playHistoryModel from '../models/playHistoryModel.js';
import songModel from '../models/songModel.js';

const recordPlay = async (req, res) => {
    try {
        const { songId, durationPlayed } = req.body;
        const history = new playHistoryModel({
            userId: req.userId,
            songId,
            durationPlayed,
        });
        await history.save();
        // Increment playCount
        await songModel.findByIdAndUpdate(songId, { $inc: { playCount: 1 } });
        res.json({ success: true, history });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error recording play' });
    }
};

const getHistory = async (req, res) => {
    try {
        const history = await playHistoryModel
            .find({ userId: req.userId })
            .populate('songId', 'name image duration')
            .sort({ playedAt: -1 })
            .limit(50);
        res.json({ success: true, history });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching history' });
    }
};

const getRecentHistory = async (req, res) => {
    try {
        const history = await playHistoryModel
            .find({ userId: req.userId })
            .populate('songId', 'name image duration')
            .sort({ playedAt: -1 })
            .limit(10);
        res.json({ success: true, history });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching recent history' });
    }
};

export { recordPlay, getHistory, getRecentHistory };
