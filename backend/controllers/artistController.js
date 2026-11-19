import artistModel from '../models/artistModel.js';
import songModel from '../models/songModel.js';
import albumModel from '../models/albumModel.js';

const listArtists = async (req, res) => {
    try {
        const artists = await artistModel.find({});
        res.json({ success: true, artists });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching artists' });
    }
};

const getArtist = async (req, res) => {
    try {
        const artist = await artistModel.findById(req.params.id);
        if (!artist) return res.json({ success: false, message: 'Artist not found' });
        res.json({ success: true, artist });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching artist' });
    }
};

const getArtistSongs = async (req, res) => {
    try {
        const songs = await songModel
            .find({ artistIds: req.params.id })
            .populate('albumId');
        res.json({ success: true, songs });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching artist songs' });
    }
};

const getArtistAlbums = async (req, res) => {
    try {
        const albums = await albumModel.find({ artistIds: req.params.id });
        res.json({ success: true, albums });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching artist albums' });
    }
};

export { listArtists, getArtist, getArtistSongs, getArtistAlbums };
