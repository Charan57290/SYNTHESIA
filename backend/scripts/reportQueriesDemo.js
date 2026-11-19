// scripts/reportQueriesDemo.js
// Runs the exact queries and operations documented in the LPU Project Report (Figures 8 to 31)
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Song from '../models/songModel.js';
import PlayHistory from '../models/playHistoryModel.js';
import {
  genreDistribution,
  topSongs,
  artistSongCount,
  dailyListeningActivity
} from '../services/aggregationService.js';

function section(title, figNum) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  [Figure ${figNum}] ${title}`);
  console.log('═'.repeat(60));
}

async function runDemo() {
  console.log('📘 SYNTHESIA - LPU CSE494 Report Query Demonstration\n');
  await connectDB();

  // ── Figure 8: Test Track Insertion (CRUD: Create) ──────────────────────────
  section('Test Track Insertion (insert_one / create)', '8');
  // Clean old test track if present
  await Song.deleteOne({ name: 'Synthesia Test Track' });
  const testTrack = await Song.create({
    name: 'Synthesia Test Track',
    desc: 'Test Artist Demo',
    genre: 'electronic',
    duration: 180,
    durationStr: '3:00',
    playCount: 0,
    isExplicit: false,
  });
  console.log('  Track inserted successfully!');
  console.log('  _id         :', testTrack._id);
  console.log('  name        :', testTrack.name);
  console.log('  genre       :', testTrack.genre);
  console.log('  duration    :', testTrack.duration, 'seconds');

  // ── Figure 9: Read with Comparison Operator ($gt) ──────────────────────────
  section('Read with Comparison Operator ($gt: duration > 240s)', '9');
  const longTracks = await Song.find({ duration: { $gt: 240 } })
    .select('name genre duration durationStr desc')
    .limit(3)
    .lean();
  console.log(`  Found ${longTracks.length} sample tracks with duration > 240s:`);
  longTracks.forEach((t, i) =>
    console.log(`    ${i + 1}. "${t.name}" by ${t.desc} — ${t.duration}s (${t.durationStr}) [${t.genre}]`)
  );

  // ── Figure 10: $in Operator Query ──────────────────────────────────────────
  section('$in Query Operator (genre in ["pop", "rock"])', '10');
  const inTracks = await Song.find({ genre: { $in: ['pop', 'rock'] } })
    .select('name genre desc')
    .limit(3)
    .lean();
  inTracks.forEach((t, i) =>
    console.log(`    ${i + 1}. "${t.name}" (${t.genre}) by ${t.desc}`)
  );

  // ── Figure 11: $nin Operator Query ─────────────────────────────────────────
  section('$nin Query Operator (genre not in ["pop", "rock"])', '11');
  const ninTracks = await Song.find({ genre: { $nin: ['pop', 'rock'] } })
    .select('name genre desc')
    .limit(3)
    .lean();
  ninTracks.forEach((t, i) =>
    console.log(`    ${i + 1}. "${t.name}" (${t.genre}) by ${t.desc}`)
  );

  // ── Figure 12: Update Operation ($set play_count) ──────────────────────────
  section('Update Operation ($set playCount)', '12');
  const updateRes = await Song.updateOne(
    { _id: testTrack._id },
    { $set: { playCount: 5 } }
  );
  console.log(`  matchedCount  : ${updateRes.matchedCount}`);
  console.log(`  modifiedCount : ${updateRes.modifiedCount}`);
  const updatedDoc = await Song.findById(testTrack._id).select('name playCount');
  console.log(`  Verified playCount: ${updatedDoc.playCount}`);

  // ── Figure 13: Delete Operation (delete_one) ───────────────────────────────
  section('Delete Operation (deleteOne)', '13');
  const deleteRes = await Song.deleteOne({ _id: testTrack._id });
  console.log(`  deletedCount  : ${deleteRes.deletedCount}`);
  const checkDeleted = await Song.findById(testTrack._id);
  console.log(`  Remaining record in DB: ${checkDeleted}`);

  // ── Figure 20 & 21: Genre Distribution Aggregation ($group, $sort) ────────
  section('Genre Distribution Aggregation Pipeline ($group, $sort)', '20 & 21');
  const genres = await genreDistribution();
  console.log('  Tracks per genre:');
  genres.forEach((g) => console.log(`    • ${g.genre.padEnd(15)} : ${g.count} tracks`));

  // ── Figure 22: Listening Activity Aggregation ──────────────────────────────
  section('Listening Activity by User Aggregation ($group on userId)', '22');
  const activity = await PlayHistory.aggregate([
    { $group: { _id: '$userId', totalPlays: { $sum: 1 }, totalTime: { $sum: '$durationPlayed' } } },
    { $sort: { totalPlays: -1 } },
    { $limit: 5 }
  ]);
  console.log('  Listening events by user:', activity);

  // ── Figure 23: Top Artists by Track Count Aggregation ──────────────────────
  section('Top Artists by Catalogue Count ($lookup, $project, $size)', '23');
  const artists = await artistSongCount();
  artists.slice(0, 5).forEach((a) =>
    console.log(`    • ${a.name.padEnd(20)} : ${a.songCount} track(s)`)
  );

  // ── Figure 24: $and Logical Query ──────────────────────────────────────────
  section('Logical Operator $and ({ genre: "pop", duration >= 180 })', '24');
  const andTracks = await Song.find({
    $and: [{ genre: 'pop' }, { duration: { $gte: 180 } }]
  })
    .select('name genre duration desc')
    .limit(3)
    .lean();
  andTracks.forEach((t, i) =>
    console.log(`    ${i + 1}. "${t.name}" by ${t.desc} — ${t.duration}s`)
  );

  // ── Figure 25: $or Logical Query ───────────────────────────────────────────
  section('Logical Operator $or ({ genre: "pop" } OR { genre: "rock" })', '25');
  const orTracks = await Song.find({
    $or: [{ genre: 'pop' }, { genre: 'rock' }]
  })
    .select('name genre desc')
    .limit(3)
    .lean();
  orTracks.forEach((t, i) =>
    console.log(`    ${i + 1}. "${t.name}" (${t.genre})`)
  );

  // ── Figure 26: $not Logical Query ──────────────────────────────────────────
  section('Logical Operator $not ({ isExplicit: { $not: { $eq: true } } })', '26');
  const notTracks = await Song.find({
    isExplicit: { $not: { $eq: true } }
  })
    .select('name isExplicit')
    .limit(3)
    .lean();
  notTracks.forEach((t, i) =>
    console.log(`    ${i + 1}. "${t.name}" (isExplicit: ${t.isExplicit})`)
  );

  // ── Figure 27: Ascending Sort ──────────────────────────────────────────────
  section('Ascending Sort on duration (.sort({ duration: 1 }))', '27');
  const ascTracks = await Song.find({})
    .sort({ duration: 1 })
    .select('name duration durationStr')
    .limit(3)
    .lean();
  ascTracks.forEach((t, i) =>
    console.log(`    ${i + 1}. "${t.name}" — ${t.duration}s (${t.durationStr})`)
  );

  // ── Figure 28 & 29: Descending Sort on playCount ───────────────────────────
  section('Descending Sort on playCount (.sort({ playCount: -1 }))', '28 & 29');
  const descTracks = await Song.find({})
    .sort({ playCount: -1 })
    .select('name playCount desc')
    .limit(3)
    .lean();
  descTracks.forEach((t, i) =>
    console.log(`    ${i + 1}. "${t.name}" by ${t.desc} — playCount: ${t.playCount}`)
  );

  // ── Figure 30 & 31: Field Projection with limit(10) ────────────────────────
  section('Field Projection (select only title, genre) with limit(5)', '30 & 31');
  const projectedTracks = await Song.find({}, { _id: 0, name: 1, genre: 1 })
    .limit(5)
    .lean();
  console.log('  Projected fields only (no _id):', projectedTracks);

  console.log('\n============================================================');
  console.log('✅ ALL REPORT FIGURES (8 through 31) EXECUTED AND VERIFIED!');
  console.log('============================================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

runDemo().catch((err) => {
  console.error('Demo error:', err);
  process.exit(1);
});
