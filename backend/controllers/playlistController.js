import playlistModel from '../models/playlistModel.js';

const createPlaylist = async (req, res) => {
    try {
        const { name, description, isPublic } = req.body;
        const playlist = new playlistModel({
            name,
            description,
            isPublic: isPublic || false,
            userId: req.userId,
        });
        await playlist.save();
        res.json({ success: true, playlist });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error creating playlist' });
    }
};

const getUserPlaylists = async (req, res) => {
    try {
        const playlists = await playlistModel
            .find({ userId: req.userId })
            .populate('songIds', 'name image duration');
        res.json({ success: true, playlists });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching playlists' });
    }
};

const getPlaylist = async (req, res) => {
    try {
        const playlist = await playlistModel
            .findById(req.params.id)
            .populate('songIds');
        if (!playlist) return res.json({ success: false, message: 'Playlist not found' });
        if (!playlist.isPublic && String(playlist.userId) !== String(req.userId)) {
            return res.json({ success: false, message: 'Unauthorized' });
        }
        res.json({ success: true, playlist });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error fetching playlist' });
    }
};

const addSongToPlaylist = async (req, res) => {
    try {
        const playlist = await playlistModel.findById(req.params.id);
        if (!playlist) return res.json({ success: false, message: 'Playlist not found' });
        if (String(playlist.userId) !== String(req.userId)) {
            return res.json({ success: false, message: 'Unauthorized' });
        }
        const updated = await playlistModel.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { songIds: req.body.songId } },
            { new: true }
        ).populate('songIds', 'name image duration');
        res.json({ success: true, playlist: updated });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error adding song to playlist' });
    }
};

const removeSongFromPlaylist = async (req, res) => {
    try {
        const playlist = await playlistModel.findById(req.params.id);
        if (!playlist) return res.json({ success: false, message: 'Playlist not found' });
        if (String(playlist.userId) !== String(req.userId)) {
            return res.json({ success: false, message: 'Unauthorized' });
        }
        const updated = await playlistModel.findByIdAndUpdate(
            req.params.id,
            { $pull: { songIds: req.params.songId } },
            { new: true }
        ).populate('songIds', 'name image duration');
        res.json({ success: true, playlist: updated });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error removing song from playlist' });
    }
};

export { createPlaylist, getUserPlaylists, getPlaylist, addSongToPlaylist, removeSongFromPlaylist };
