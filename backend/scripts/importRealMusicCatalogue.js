// scripts/importRealMusicCatalogue.js
// Batch imports real music from Apple iTunes Search API + MusicBrainz
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { importMusic } from '../services/musicImportService.js';

const searchQueries = [
  { term: 'Coldplay', genre: 'alternative' },
  { term: 'Ed Sheeran', genre: 'pop' },
  { term: 'Daft Punk', genre: 'electronic' },
  { term: 'Queen', genre: 'rock' },
  { term: 'Taylor Swift', genre: 'pop' },
  { term: 'Imagine Dragons', genre: 'rock' },
  { term: 'Billie Eilish', genre: 'alternative' },
  { term: 'Hans Zimmer', genre: 'soundtrack' },
  { term: 'Calvin Harris', genre: 'dance' },
  { term: 'The Weeknd', genre: 'r&b' },
];

async function runBatchImport() {
  console.log('🚀 Starting Real Music API Batch Ingestion...');
  await connectDB();

  let totalImported = 0;
  let totalErrors = 0;

  for (const query of searchQueries) {
    console.log(`\n📥 Fetching live tracks for "${query.term}" (${query.genre})...`);
    try {
      const res = await importMusic({
        term: query.term,
        genre: query.genre,
        limit: 8,
        source: 'itunes',
      });
      console.log(`   ✅ Imported: ${res.imported}, Skipped: ${res.skipped}, Errors: ${res.errors.length}`);
      totalImported += res.imported;
      totalErrors += res.errors.length;
    } catch (err) {
      console.error(`   ❌ Failed query "${query.term}":`, err.message);
      totalErrors++;
    }
  }

  console.log('\n=======================================');
  console.log(`🎉 Ingestion Complete!`);
  console.log(`   Total New/Updated Real Tracks: ${totalImported}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log('=======================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

runBatchImport().catch(err => {
  console.error('Fatal batch import error:', err);
  process.exit(1);
});
