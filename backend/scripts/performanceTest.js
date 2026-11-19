// scripts/performanceTest.js
// Performance measurement via MongoDB explain("executionStats")
// Run: node scripts/performanceTest.js

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Song from '../models/songModel.js';
import Album from '../models/albumModel.js';
import PlayHistory from '../models/playHistoryModel.js';

// ── Helpers ────────────────────────────────────────────────────────────────
function section(title) {
  console.log(`\n${'═'.repeat(55)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(55));
}

function printStats(label, stats) {
  const es = stats?.executionStats ?? {};
  const wp = stats?.queryPlanner?.winningPlan ?? {};
  const inputStage = wp.inputStage ?? {};

  const indexName =
    inputStage.indexName ??
    (inputStage.inputStage && inputStage.inputStage.indexName) ??
    '(none — collection scan)';

  console.log(`\n  🔎  ${label}`);
  console.log(`       totalDocsExamined : ${es.totalDocsExamined ?? 'n/a'}`);
  console.log(`       totalKeysExamined : ${es.totalKeysExamined ?? 'n/a'}`);
  console.log(`       executionTimeMillis: ${es.executionTimeMillis ?? 'n/a'} ms`);
  console.log(`       index used        : ${indexName}`);
}

// ── Main ───────────────────────────────────────────────────────────────────
async function runTests() {
  console.log('⚡  SYNTHESIA Performance Test\n');
  await connectDB();

  // Grab sample IDs to build realistic queries
  const sampleSong = await Song.findOne({}).select('_id artistIds albumId').lean();
  const sampleHistory = await PlayHistory.findOne({}).select('userId').lean();

  const someUserId = sampleHistory?.userId ?? new mongoose.Types.ObjectId();
  const someArtistId =
    sampleSong?.artistIds?.[0] ?? new mongoose.Types.ObjectId();

  // ── 1. Song queries ────────────────────────────────────────────────────
  section('SONG QUERIES');

  try {
    const stats1 = await Song.find({ genre: 'electronic' }).explain('executionStats');
    printStats('Song.find({ genre: "electronic" })', stats1);
  } catch (err) {
    console.log('  ⚠️  genre query explain failed:', err.message);
  }

  try {
    const stats2 = await Song.find({})
      .sort({ playCount: -1 })
      .limit(10)
      .explain('executionStats');
    printStats('Song.find({}).sort({ playCount: -1 }).limit(10)', stats2);
  } catch (err) {
    console.log('  ⚠️  playCount sort explain failed:', err.message);
  }

  try {
    const stats3 = await Song.find({ artistIds: someArtistId }).explain('executionStats');
    printStats(`Song.find({ artistIds: <ObjectId> })`, stats3);
  } catch (err) {
    console.log('  ⚠️  artistIds query explain failed:', err.message);
  }

  // ── 2. PlayHistory queries ─────────────────────────────────────────────
  section('PLAYHISTORY QUERIES');

  try {
    const stats4 = await PlayHistory.find({ userId: someUserId })
      .sort({ playedAt: -1 })
      .explain('executionStats');
    printStats(`PlayHistory.find({ userId: <ObjectId> }).sort({ playedAt: -1 })`, stats4);
  } catch (err) {
    console.log('  ⚠️  PlayHistory userId explain failed:', err.message);
  }

  // ── 3. Album queries ───────────────────────────────────────────────────
  section('ALBUM QUERIES');

  try {
    const stats5 = await Album.find({ artistIds: someArtistId }).explain('executionStats');
    printStats(`Album.find({ artistIds: <ObjectId> })`, stats5);
  } catch (err) {
    console.log('  ⚠️  Album artistIds explain failed:', err.message);
  }

  // ── 4. Summary ─────────────────────────────────────────────────────────
  section('TEST COMPLETE');
  console.log(
    '\n  Review the index names above. A "(none — collection scan)" means\n' +
      '  the query is not using an index — consider adding one.\n'
  );

  await mongoose.connection.close();
  console.log('✅  Performance test finished.');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌  Performance test error:', err);
  process.exit(1);
});
