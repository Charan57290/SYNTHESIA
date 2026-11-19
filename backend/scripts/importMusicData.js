// scripts/importMusicData.js
// Standalone music-import script
// Run: node scripts/importMusicData.js [--genre=electronic] [--limit=20] [--source=jamendo]

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

// ── Parse CLI arguments ────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { term: null, genre: null, limit: 20, source: 'itunes' };
  for (const arg of argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    if (key === 'term') args.term = value;
    else if (key === 'genre') args.genre = value;
    else if (key === 'limit') args.limit = parseInt(value, 10) || 20;
    else if (key === 'source') args.source = value;
  }
  return args;
}

// ── Graceful shutdown ──────────────────────────────────────────────────────
let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('\n🔌  Closing database connection…');
  try {
    await mongoose.connection.close();
  } catch (_) {
    // ignore
  }
  console.log('👋  Done.');
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);
  console.log('🎵  SYNTHESIA Music Importer');
  console.log(`    source : ${args.source}`);
  console.log(`    genre  : ${args.genre || '(all)'}`);
  console.log(`    limit  : ${args.limit}`);
  console.log('');

  // Environment checks
  if (!process.env.JAMENDO_CLIENT_ID) {
    console.warn(
      '⚠️   JAMENDO_CLIENT_ID not set — Jamendo imports will be skipped or rate-limited.'
    );
  }
  if (!process.env.LASTFM_API_KEY) {
    console.warn('⚠️   LASTFM_API_KEY not set — Last.fm metadata enrichment disabled.');
  }

  await connectDB();

  // Dynamically import the service so the script works even if the file doesn't
  // exist yet during development (graceful degradation).
  let importMusic;
  try {
    const mod = await import('../services/musicImportService.js');
    importMusic = mod.importMusic || mod.default;
    if (typeof importMusic !== 'function') {
      throw new Error('musicImportService does not export importMusic()');
    }
  } catch (err) {
    console.error('❌  Could not load musicImportService:', err.message);
    await shutdown(1);
    return;
  }

  console.log('🚀  Starting import…\n');

  let result;
  try {
    result = await importMusic({
      term: args.term,
      genre: args.genre,
      limit: args.limit,
      source: args.source,
    });
  } catch (err) {
    console.error('❌  Import error:', err.message);
    await shutdown(1);
    return;
  }

  // ── Print results ──────────────────────────────────────────────────────
  const imported = result?.imported ?? 0;
  const skipped = result?.skipped ?? 0;
  const errorCount = Array.isArray(result?.errors) ? result.errors.length : 0;
  const errorList = Array.isArray(result?.errors) ? result.errors : [];

  console.log('\n═══════════════════════════════════════');
  console.log('  IMPORT SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`  Imported : ${imported}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Errors   : ${errorCount}`);
  if (errorList.length > 0) {
    console.log('\n  Error details:');
    errorList.forEach((d, i) => console.log(`    ${i + 1}. ${d.message || JSON.stringify(d)}`));
  }
  console.log('═══════════════════════════════════════\n');

  await shutdown(0);
}

main().catch(async (err) => {
  console.error('❌  Unexpected error:', err);
  await shutdown(1);
});
