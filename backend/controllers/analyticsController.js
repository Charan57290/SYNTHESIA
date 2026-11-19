import {
    genreDistribution,
    topSongs,
    artistSongCount,
    totalListeningTimePerUser,
    dailyListeningActivity,
    mostActiveUsers,
} from '../services/aggregationService.js';

const getGenreDistribution = async (req, res) => {
    try {
        const data = await genreDistribution();
        res.json({ success: true, data });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching genre distribution' });
    }
};

const getTopSongs = async (req, res) => {
    try {
        const data = await topSongs(10);
        res.json({ success: true, data });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching top songs' });
    }
};

const getTopArtists = async (req, res) => {
    try {
        const data = await artistSongCount();
        res.json({ success: true, data });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching top artists' });
    }
};

const getListeningStats = async (req, res) => {
    try {
        const totalTime = await totalListeningTimePerUser(req.userId);
        const daily = await dailyListeningActivity(req.userId);
        res.json({ success: true, totalTime, daily });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching listening stats' });
    }
};

const getActiveUsers = async (req, res) => {
    try {
        const data = await mostActiveUsers(10);
        res.json({ success: true, data });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching active users' });
    }
};

export { getGenreDistribution, getTopSongs, getTopArtists, getListeningStats, getActiveUsers };
