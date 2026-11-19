import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import songRouter from './routes/songRoute.js';
import albumRouter from './routes/albumRoute.js';
import userRouter from './routes/userRoute.js';
import artistRouter from './routes/artistRoute.js';
import playlistRouter from './routes/playlistRoute.js';
import historyRouter from './routes/playHistoryRoute.js';
import analyticsRouter from './routes/analyticsRoute.js';
import adminRouter from './routes/adminRoute.js';
import { connectDB } from './config/db.js';


// App Config
const app = express();
const port = process.env.PORT || 4000;
connectDB();

// Middlewares
app.use(express.json());
app.use(cors());

// Initializing Routes
app.use("/api/song", songRouter);
app.use("/api/album", albumRouter);
app.use("/api/user", userRouter);
app.use("/api/artists", artistRouter);
app.use("/api/playlists", playlistRouter);
app.use("/api/history", historyRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/admin", adminRouter);
app.use('/images', express.static('uploads'));
app.get('/', (req, res) => {
    res.send("API Working");
});

app.listen(port, () => console.log(`Server started on ${port}`));

export default app;
