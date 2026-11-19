// scripts/verifyDatabase.js
// Database verification and health-check script
// Run: node scripts/verifyDatabase.js

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Song from '../models/songModel.js';
import Album from '../models/albumModel.js';
import Artist from '../models/artistModel.js';
import Playlist from '../models/playlistModel.js';
import PlayHistory from '../models/playHistoryModel.js';
import User from '../models/userModel.js';

// ── Helpers ────────────────────────────────────────────────────────────────
function section(title) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(50));
}

function row(label, value) {
  console.log(`  ${label.padEnd(35)} ${value}`);
}

async function listIndexes(model) {
  const indexes = await model.collection.listIndexes().toArray();
  return indexes.map((idx) => ({
    name: idx.name,
    key: JSON.stringify(idx.key),
    unique: idx.unique || false,
    sparse: idx.sparse || false,
  }));
}

function safeExplain(stats) {
  const es = stats?.executionStats ?? {};
  const wp = stats?.queryPlanner?.winningPlan ?? {};
  const inputStage = wp.inputStage ?? {};
  return {
    totalDocsExamined: es.totalDocsExamined ?? 'n/a',
    totalKeysExamined: es.totalKeysExamined ?? 'n/a',
    executionTimeMillis: es.executionTimeMillis ?? 'n/a',
    indexName: inputStage.indexName ?? '(collection scan)',
  };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function verify() {
  console.log('🔍  SYNTHESIA Database Verification');
  await connectDB();

  // ── 1. Document counts ─────────────────────────────────────────────────
  section('DOCUMENT COUNTS');
  const counts = {
    users: await User.countDocuments(),
    songs: await Song.countDocuments(),
    albums: await Album.countDocuments(),
    artists: await Artist.countDocuments(),
    playlists: await Playlist.countDocuments(),
    playhistories: await PlayHistory.countDocuments(),
  };
  for (const [col, n] of Object.entries(counts)) row(col, n);

  // ── 2. Index verification ──────────────────────────────────────────────
  section('INDEXES');
  for (const [label, model] of [
    ['Song', Song],
    ['Album', Album],
    ['Artist', Artist],
    ['Playlist', Playlist],
    ['PlayHistory', PlayHistory],
    ['User', User],
  ]) {
    console.log(`\n  [${label}]`);
    const idxs = await listIndexes(model);
    idxs.forEach((i) =>
      console.log(
        `    • ${i.name}  key=${i.key}${i.unique ? ' UNIQUE' : ''}${i.sparse ? ' SPARSE' : ''}`
      )
    );
  }

  // ── 3. Orphaned songs (no albumId AND no album string) ─────────────────
  section('ORPHANED SONGS');
  const orphaned = await Song.find({
    albumId: { $in: [null, undefined] },
    $or: [{ album: { $exists: false } }, { album: '' }, { album: null }],
  }).select('_id name');
  row('Songs with no album at all:', orphaned.length);
  if (orphaned.length > 0 && orphaned.length <= 10) {
    orphaned.forEach((s) => console.log(`    - ${s._id} "${s.name}"`));
  } else if (orphaned.length > 10) {
    console.log(`    (showing first 10)`);
    orphaned.slice(0, 10).forEach((s) => console.log(`    - ${s._id} "${s.name}"`));
  }

  // ── 4. Songs with empty artistIds ─────────────────────────────────────
  section('SONGS WITH NO ARTISTS');
  const noArtist = await Song.find({
    $or: [{ artistIds: { $exists: false } }, { artistIds: { $size: 0 } }],
  }).select('_id name');
  row('Songs with artistIds = []:', noArtist.length);
  if (noArtist.length > 0 && noArtist.length <= 10) {
    noArtist.forEach((s) => console.log(`    - ${s._id} "${s.name}"`));
  }

  // ── 5. Aggregation samples ────────────────────────────────────────────
  section('AGGREGATION SAMPLES');

  // Try to load aggregationService; skip gracefully if not found
  let aggService = null;
  try {
    aggService = await import('../services/aggregationService.js');
    console.log('  aggregationService loaded ✓');
  } catch (err) {
    console.log(`  ⚠️  aggregationService not found: ${err.message}`);
  }

  if (aggService) {
    const fns = Object.entries(aggService).filter(
      ([, v]) => typeof v === 'function'
    );
    console.log(`  Found ${fns.length} exported function(s):`);
    for (const [name, fn] of fns) {
      try {
        const result = await fn();
        const sample = Array.isArray(result) ? result.slice(0, 2) : result;
        console.log(`\n  ${name}() — sample result:`);
        console.log(JSON.stringify(sample, null, 4).split('\n').map((l) => '    ' + l).join('\n'));
      } catch (err) {
        console.log(`  ⚠️  ${name}() errored: ${err.message}`);
      }
    }
  }

  // ── 6. Explain plans for key queries ──────────────────────────────────
  section('INDEX USAGE (explain)');

  // Grab a real ObjectId for explain tests if possible
  const sampleSong = await Song.findOne({}).select('_id artistIds').lean();
  const someArtistId =
    sampleSong?.artistIds?.[0] ?? new mongoose.Types.ObjectId();
  const sampleHistory = await PlayHistory.findOne({}).select('userId').lean();
  const someUserId = sampleHistory?.userId ?? new mongoose.Types.ObjectId();

  const queries = [
    {
      label: 'Song.find({ genre: "electronic" })',
      exec: () =>
        Song.find({ genre: 'electronic' }).explain('executionStats'),
    },
    {
      label: `Song.find({ artistIds: ${someArtistId} })`,
      exec: () =>
        Song.find({ artistIds: someArtistId }).explain('executionStats'),
    },
    {
      label: `PlayHistory.find({ userId: ${someUserId} })`,
      exec: () =>
        PlayHistory.find({ userId: someUserId }).explain('executionStats'),
    },
  ];

  for (const q of queries) {
    console.log(`\n  Query: ${q.label}`);
    try {
      const stats = await q.exec();
      const r = safeExplain(stats);
      console.log(`    docsExamined       : ${r.totalDocsExamined}`);
      console.log(`    keysExamined       : ${r.totalKeysExamined}`);
      console.log(`    executionTimeMillis: ${r.executionTimeMillis}`);
      console.log(`    index used         : ${r.indexName}`);
    } catch (err) {
      console.log(`    ⚠️  explain() failed: ${err.message}`);
    }
  }

  // ── 7. Final summary ───────────────────────────────────────────────────
  section('SUMMARY');
  row('DB connected :', '✓');
  row('Collections  :', Object.keys(counts).length);
  row('Orphaned songs:', orphaned.length === 0 ? '✓ none' : `⚠️  ${orphaned.length}`);
  row('Songs no artist:', noArtist.length === 0 ? '✓ none' : `⚠️  ${noArtist.length}`);

  console.log('\n');
  await mongoose.connection.close();
  console.log('✅  Verification complete.');
  process.exit(0);
}

verify().catch((err) => {
  console.error('❌  Verification failed:', err);
  process.exit(1);
});
