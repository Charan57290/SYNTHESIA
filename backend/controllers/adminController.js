import { importMusic } from '../services/musicImportService.js';

const importMusicHandler = async (req, res) => {
    try {
        const { genre, artistName, limit, source } = req.body;
        const result = await importMusic({ genre, artistName, limit, source });
        res.json(result);
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error running music import' });
    }
};

const getImportStatus = async (req, res) => {
    try {
        res.json({ success: true, message: 'Import service active' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: 'Error' });
    }
};

export { importMusicHandler, getImportStatus };
