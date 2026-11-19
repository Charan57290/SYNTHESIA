// Direct DB seed — bypasses HTTP, inserts straight into MongoDB
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import albumModel from '../models/albumModel.js';
import songModel from '../models/songModel.js';
import artistModel from '../models/artistModel.js';

const albums = [
  { name: "Workout Hits",    desc: "High energy tracks",   bgColour: "#e74c3c", image: "https://picsum.photos/id/64/500/500" },
  { name: "Love Songs",      desc: "Romantic favorites",   bgColour: "#e91e8c", image: "https://picsum.photos/id/65/500/500" },
  { name: "Chill Lo-Fi",     desc: "Beats to study/relax", bgColour: "#3498db", image: "https://picsum.photos/id/66/500/500" },
  { name: "Relaxing Piano",  desc: "Classical piano",      bgColour: "#9b59b6", image: "https://picsum.photos/id/74/500/500" },
  { name: "Rock Classics",   desc: "Greatest rock hits",   bgColour: "#2c3e50", image: "https://picsum.photos/id/75/500/500" },
  { name: "Happy Vibes",     desc: "Feel good music",      bgColour: "#f39c12", image: "https://picsum.photos/id/77/500/500" },
];

const songsByAlbum = {
  "Workout Hits": [
    { name: "Eye of the Tiger",    desc: "Survivor",              image: "https://picsum.photos/id/80/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",  durationStr: "4:05", duration: 245 },
    { name: "Stronger",            desc: "Kanye West",            image: "https://picsum.photos/id/81/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",  durationStr: "5:11", duration: 311 },
    { name: "Lose Yourself",       desc: "Eminem",                image: "https://picsum.photos/id/82/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",  durationStr: "5:26", duration: 326 },
    { name: "Don't Stop Me Now",   desc: "Queen",                 image: "https://picsum.photos/id/83/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",  durationStr: "3:29", duration: 209 },
  ],
  "Love Songs": [
    { name: "Perfect",             desc: "Ed Sheeran",            image: "https://picsum.photos/id/68/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",  durationStr: "4:23", duration: 263 },
    { name: "All of Me",           desc: "John Legend",           image: "https://picsum.photos/id/69/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",  durationStr: "4:29", duration: 269 },
    { name: "Just the Way You Are",desc: "Bruno Mars",            image: "https://picsum.photos/id/70/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",  durationStr: "3:40", duration: 220 },
    { name: "Thinking Out Loud",   desc: "Ed Sheeran",            image: "https://picsum.photos/id/71/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",  durationStr: "4:41", duration: 281 },
  ],
  "Chill Lo-Fi": [
    { name: "Sunset Lover",        desc: "Petit Biscuit",         image: "https://picsum.photos/id/84/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",  durationStr: "3:51", duration: 231 },
    { name: "Weightless",          desc: "Marconi Union",         image: "https://picsum.photos/id/72/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", durationStr: "8:10", duration: 490 },
    { name: "Midnight City",       desc: "M83",                   image: "https://picsum.photos/id/85/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", durationStr: "4:03", duration: 243 },
  ],
  "Relaxing Piano": [
    { name: "River Flows in You",  desc: "Yiruma",                image: "https://picsum.photos/id/74/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", durationStr: "3:08", duration: 188 },
    { name: "Clair de Lune",       desc: "Claude Debussy",        image: "https://picsum.photos/id/86/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", durationStr: "5:05", duration: 305 },
    { name: "Nuvole Bianche",      desc: "Ludovico Einaudi",      image: "https://picsum.photos/id/87/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3", durationStr: "6:00", duration: 360 },
  ],
  "Rock Classics": [
    { name: "Bohemian Rhapsody",   desc: "Queen",                 image: "https://picsum.photos/id/75/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", durationStr: "5:55", duration: 355 },
    { name: "Sweet Child O' Mine", desc: "Guns N' Roses",         image: "https://picsum.photos/id/76/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3", durationStr: "5:56", duration: 356 },
    { name: "Hotel California",    desc: "Eagles",                image: "https://picsum.photos/id/88/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3", durationStr: "6:30", duration: 390 },
    { name: "Smells Like Teen Spirit", desc: "Nirvana",           image: "https://picsum.photos/id/89/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",  durationStr: "5:01", duration: 301 },
  ],
  "Happy Vibes": [
    { name: "Can't Stop the Feeling!", desc: "Justin Timberlake", image: "https://picsum.photos/id/77/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3", durationStr: "3:56", duration: 236 },
    { name: "Happy",               desc: "Pharrell Williams",     image: "https://picsum.photos/id/90/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",  durationStr: "3:53", duration: 233 },
    { name: "Walking on Sunshine", desc: "Katrina and the Waves", image: "https://picsum.photos/id/91/300/300", file: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",  durationStr: "3:58", duration: 238 },
  ],
};

const genreMap = {
  "Workout Hits":   "workout",
  "Love Songs":     "pop",
  "Chill Lo-Fi":    "lo-fi",
  "Relaxing Piano": "classical",
  "Rock Classics":  "rock",
  "Happy Vibes":    "pop",
};

async function seed() {
  console.log('🌱 Direct DB Seed starting...');
  await connectDB();

  // Clear existing
  console.log('🧹 Clearing songs and albums...');
  await songModel.deleteMany({});
  await albumModel.deleteMany({});

  // Get or create "Various Artists"
  let various = await artistModel.findOne({ name: 'Various Artists' });
  if (!various) {
    various = await artistModel.create({ name: 'Various Artists', bio: 'Default', image: '', country: '' });
  }

  let albumCount = 0, songCount = 0;

  for (const albumData of albums) {
    const album = await albumModel.create({ ...albumData, artistIds: [various._id] });
    albumCount++;
    console.log(`✅ Album: ${album.name} (${album._id})`);

    const songs = songsByAlbum[albumData.name] || [];
    for (const s of songs) {
      await songModel.create({
        name:       s.name,
        desc:       s.desc,
        album:      albumData.name,       // backward-compat string
        albumId:    album._id,            // new ObjectId ref
        artistIds:  [various._id],
        image:      s.image,
        file:       s.file,
        duration:   s.duration,
        durationStr: s.durationStr,
        genre:      genreMap[albumData.name] || 'general',
        playCount:  0,
      });
      songCount++;
      console.log(`  🎵 ${s.name}`);
    }
  }

  console.log(`\n✨ Seeding complete! Albums: ${albumCount}, Songs: ${songCount}`);
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
