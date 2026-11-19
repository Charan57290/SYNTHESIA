# SYNTHESIA — Music Data Import Guide

This guide walks you through obtaining API credentials, running the database migration, and importing real music data from free, openly-licensed sources.

---

## External Providers

| Provider | Key Required | Cost | License |
|---|---|---|---|
| [Jamendo](https://developer.jamendo.com/) | ✅ Client ID | Free | CC-licensed tracks only |
| [Last.fm](https://www.last.fm/api) | ✅ API Key | Free | Metadata only |
| [MusicBrainz](https://musicbrainz.org/doc/MusicBrainz_API) | ❌ None | Free | Open metadata |
| [iTunes Search API](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/) | ❌ None | Free | Metadata only |

> [!NOTE]
> SYNTHESIA only imports tracks from Jamendo that have `audiodownload_allowed = true`. This means every audio file you import is explicitly licensed for free download by the artist under a Creative Commons licence. No proprietary or rights-managed content is ever pulled in.

---

## Prerequisites

### Jamendo Client ID (Free)

1. Go to [developer.jamendo.com](https://developer.jamendo.com/)
2. Sign up / log in with a free account
3. Create a new application — any name works
4. Copy your **Client ID** (not a secret; safe to share)

### Last.fm API Key (Free)

1. Go to [last.fm/api](https://www.last.fm/api)
2. Click **Get an API account** and sign in
3. Fill in the application form (name + description required)
4. Copy your **API Key** from the confirmation page

### MusicBrainz

No registration needed. The API is public and rate-limited to **1 request / second**. SYNTHESIA automatically respects this limit.

---

## Step 1 — Configure Environment Variables

```bash
# In the backend/ directory
cp .env.example .env
```

Open `.env` and fill in the credentials:

```dotenv
# MongoDB
MONGODB_URI=mongodb://localhost:27017/synthesia

# Cloudinary (for media uploads)
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_SECRET_KEY=your_secret

# JWT
JWT_SECRET=your_jwt_secret_here

# External Music APIs
JAMENDO_CLIENT_ID=your_jamendo_client_id
LASTFM_API_KEY=your_lastfm_api_key
MUSICBRAINZ_USER_AGENT=SYNTHESIA/1.0 (your@email.com)
```

> [!IMPORTANT]
> `MUSICBRAINZ_USER_AGENT` must include a contact email or URL. This is required by MusicBrainz's terms of service so they can contact you if your app misbehaves.

---

## Step 2 — Run the Database Migration

The migration script upgrades existing documents to the new schema (adds missing fields, builds indexes, cleans up orphan references).

```bash
cd backend
npm run migrate
```

**What the migration does:**
- Adds `favoriteSongs: []` to users missing the field
- Converts legacy `album` string on songs to look up / create an `albumModel` document and populate `albumId`
- Sets `playCount: 0` on songs missing the field
- Creates all required indexes (see [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md))
- Reports counts of updated / skipped documents

Expected output:
```
✔  Connected to MongoDB
✔  Users migrated: 12 updated
✔  Songs migrated: 84 updated, 0 skipped
✔  Albums migrated: 7 updated
✔  Indexes created
✔  Migration complete
```

---

## Step 3 — Import Music Data

```bash
npm run import-music -- --genre=electronic --limit=20
```

### Available Flags

| Flag | Type | Default | Description |
|---|---|---|---|
| `--genre` | String | (all) | Genre to import (e.g. `electronic`, `jazz`, `pop`, `rock`) |
| `--limit` | Number | `20` | Maximum tracks to import per provider |
| `--artist` | String | (all) | Filter by artist name |
| `--source` | String | `jamendo` | Provider: `jamendo`, `musicbrainz`, `itunes`, `lastfm` |
| `--dry-run` | Flag | false | Preview what would be imported without writing to DB |

### Examples

```bash
# Import 20 electronic tracks from Jamendo
npm run import-music -- --genre=electronic --limit=20

# Import jazz from multiple artists, preview first
npm run import-music -- --genre=jazz --limit=50 --dry-run

# Import by artist name via MusicBrainz
npm run import-music -- --artist="Nils Frahm" --source=musicbrainz --limit=10

# Import top tracks from Last.fm for a genre
npm run import-music -- --genre=ambient --source=lastfm --limit=30
```

### What Gets Imported

For each track the importer:
1. Fetches metadata (title, duration, genre, artist, album)
2. Looks up or creates an `artist` document
3. Looks up or creates an `album` document
4. Creates a `song` document with `externalIds` populated
5. Skips duplicates (detected via `externalIds.jamendo` or `externalIds.musicbrainz` sparse-unique index)

---

## Step 4 — Verify the Database

```bash
npm run verify-db
```

This script prints a summary of all collections:

```
Collection       Documents   Indexes
─────────────────────────────────────
users                   12         2
songs                  102         6
albums                  14         3
artists                 28         3
playlists                5         2
playhistories          340         4

✔  All indexes present
✔  No orphaned references found
```

---

## Rate Limit Reference

| Provider | Limit | SYNTHESIA Strategy |
|---|---|---|
| **Jamendo** | 300 req / day (free tier) | Batches requests; caches results to `.import-cache/` |
| **MusicBrainz** | 1 req / second | 1 s delay between requests (hardcoded) |
| **iTunes** | Unofficial ~20 req / min | 3 s delay between requests |
| **Last.fm** | 5 req / second | 200 ms delay between requests |

> [!TIP]
> Run imports during off-peak hours if importing large datasets (500+ tracks). The importer resumes from where it left off if interrupted — rerun the same command and duplicates will be skipped automatically.

---

## Jamendo Licensing Details

Jamendo hosts music released under **Creative Commons** licences. SYNTHESIA filters the API response to only import tracks where:

```
audiodownload_allowed === true
```

This means:
- The artist has explicitly authorised free download of the audio
- The licence is embedded in the `song` document's `desc` or `externalIds.jamendo` field
- **No tracks with "All Rights Reserved" or restricted licences are ever imported**

For your own compliance, check the specific CC licence on a per-track basis at `https://www.jamendo.com/track/<jamendo_id>`.

---

## Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `JAMENDO_CLIENT_ID not set` | Missing env var | Add `JAMENDO_CLIENT_ID` to `.env` |
| `Duplicate key error on externalIds.jamendo` | Track already imported | Safe to ignore — importer skips automatically |
| `MongoNetworkError` | MongoDB not running | Start MongoDB: `mongod` or check Atlas URI |
| `rate limit exceeded` (MusicBrainz) | Too many requests | Reduce `--limit` or add `--delay=2000` |
| `ECONNREFUSED` on import | No internet access | Check network; Jamendo/MusicBrainz are external |
