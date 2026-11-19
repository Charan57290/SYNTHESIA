// scripts/migrateDatabase.js
// Safe, idempotent database migration script
// Run: node scripts/migrateDatabase.js

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Song from '../models/songModel.js';
import Album from '../models/albumModel.js';
import Artist from '../models/artistModel.js';

/**
 * Parse a duration string like "3:30" or "1:02:45" into total seconds.
 * Returns 0 if the input is not a valid string.
 */
function parseDuration(str) {
  if (typeof str !== 'string' || !str.trim()) return 0;
  const parts = str.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) {
    // M:SS
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    // H:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

async function migrate() {
  console.log('🔄  Starting database migration…');

  await connectDB();

  const summary = {
    songsScanned: 0,
    songsAlbumMigrated: 0,
    songsDurationConverted: 0,
    songsArtistAssigned: 0,
    albumsCreated: 0,
    albumsFound: 0,
    artistsCreated: 0,
  };

  // ── 1. Ensure a "Various Artists" fallback exists ──────────────────────────
  let artistCount = await Artist.countDocuments();
  let variousArtists = await Artist.findOne({ name: 'Various Artists' });

  if (!variousArtists) {
    variousArtists = await Artist.create({
      name: 'Various Artists',
      bio: 'Default artist for songs without attribution.',
      image: '',
      country: '',
      genres: [],
    });
    summary.artistsCreated++;
    console.log(`✅  Created "Various Artists" (${variousArtists._id})`);
  } else {
    console.log(`ℹ️   "Various Artists" already exists (${variousArtists._id})`);
  }

  // ── 2. Find songs that need migration ──────────────────────────────────────
  // Needs album migration: has album string but no albumId
  // Needs duration migration: duration is a string (not a number)
  // Needs artist migration: artistIds is empty or absent
  const songs = await Song.find({});
  summary.songsScanned = songs.length;
  console.log(`📊  Total songs in DB: ${songs.length}`);

  // Build a local cache: albumName → Album document  (avoids repeated DB hits)
  const albumCache = new Map();

  for (const song of songs) {
    let dirty = false;

    // ── 2a. Album migration ──────────────────────────────────────────────────
    const needsAlbum = !song.albumId && song.album && song.album.trim();
    if (needsAlbum) {
      const albumName = song.album.trim();

      if (!albumCache.has(albumName)) {
        // Try to find existing Album by name
        let album = await Album.findOne({ name: albumName });
        if (album) {
          albumCache.set(albumName, album);
          summary.albumsFound++;
        } else {
          album = await Album.create({
            name: albumName,
            desc: 'Migrated album',
            bgColour: '#333333',
            image: '',
          });
          albumCache.set(albumName, album);
          summary.albumsCreated++;
          console.log(`  ➕  Created album "${albumName}" (${album._id})`);
        }
      }

      song.albumId = albumCache.get(albumName)._id;
      dirty = true;
      summary.songsAlbumMigrated++;
    }

    // ── 2b. Duration conversion ──────────────────────────────────────────────
    if (typeof song.duration === 'string') {
      const secs = parseDuration(song.duration);
      song.durationStr = song.duration;  // preserve original string
      song.duration = secs;
      dirty = true;
      summary.songsDurationConverted++;
    }

    // ── 2c. Artist assignment ───────────────────────────────────────────────
    const noArtists =
      !song.artistIds || song.artistIds.length === 0;
    if (noArtists) {
      song.artistIds = [variousArtists._id];
      dirty = true;
      summary.songsArtistAssigned++;
    }

    if (dirty) {
      await song.save();
    }
  }

  // ── 3. Print summary ───────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════');
  console.log('  MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`  Songs scanned          : ${summary.songsScanned}`);
  console.log(`  Albums created         : ${summary.albumsCreated}`);
  console.log(`  Albums found (reused)  : ${summary.albumsFound}`);
  console.log(`  Songs → albumId set    : ${summary.songsAlbumMigrated}`);
  console.log(`  Songs duration→seconds : ${summary.songsDurationConverted}`);
  console.log(`  Songs → Various Artists: ${summary.songsArtistAssigned}`);
  console.log(`  Artists created        : ${summary.artistsCreated}`);
  console.log('═══════════════════════════════════════\n');

  await mongoose.connection.close();
  console.log('✅  Migration complete. Connection closed.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌  Migration failed:', err);
  process.exit(1);
});
