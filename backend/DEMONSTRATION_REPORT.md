# SYNTHESIA – Technical Project Demonstration Report

---

## 1. Executive Summary

**SYNTHESIA** is a full-stack, cloud-connected music streaming and discovery application. 
- **Frontend:** React (Vite, TailwindCSS)
- **Backend:** Node.js, Express.js (ES Modules)
- **Database:** MongoDB (via Mongoose ODM) hosted on **MongoDB Atlas**
- **External Data Providers:** Apple iTunes Search API, MusicBrainz Web Services API, Jamendo API, Last.fm API

The database layer features a **6-collection relational architecture in a NoSQL database**, schema validation, deduplication via sparse unique indexes, high-performance query indexing, and 10 analytical aggregation pipelines.

---

## 2. Where Did the Data Come From? (Data Sources & Ingestion)

### A. The Primary APIs Used

| Provider | Base URL / Endpoint | Authentication | Purpose & Data Retrieved |
|---|---|---|---|
| **Apple iTunes Search API** | `https://itunes.apple.com/search` | **None** (Public) | **Live Track Data:** Track names, authentic studio AAC audio preview streams (`previewUrl`), release dates, track duration, genre classification, and album cover art upgraded to 600x600 px. |
| **MusicBrainz API** | `https://musicbrainz.org/ws/2/` | **None** (Rate-limited User-Agent header) | **Canonical Artist & Album Metadata:** Global unique MusicBrainz IDs (MBID), country of origin, biographical tags, disambiguation. |
| **Jamendo API** | `https://api.jamendo.com/v3.0/` | Client ID (`JAMENDO_CLIENT_ID`) | **Full-Length Streaming Audio:** Creative Commons tracks where `audiodownload_allowed == true`. |
| **Last.fm API** | `https://ws.audioscrobbler.com/2.0/` | API Key (`LASTFM_API_KEY`) | **Discovery & Tags:** Track popularity metrics, listener scrobble counts, and musical genres. |
| **Direct Seed / Local Uploads** | Local Disk / Node.js Multer | Authenticated Session | Baseline curated albums and manual MP3 file uploads stored in `/uploads/`. |

---

### B. The Data Ingestion Pipeline (`musicImportService.js`)

When ingestion runs (e.g., `node scripts/importMusicData.js --term=Coldplay` or via `POST /api/admin/import/music`):

1. **Extraction:** Queries `https://itunes.apple.com/search?term=<query>&entity=song&limit=<n>`.
2. **Filtering & Normalization:**
   - Validates that `trackName` and `previewUrl` exist.
   - Converts `trackTimeMillis` to seconds: `duration = Math.round(trackTimeMillis / 1000)`.
   - Converts `durationStr` to standard `"M:SS"` format for backward compatibility.
   - Replaces low-res artwork `100x100bb.jpg` with studio-grade `600x600bb.jpg`.
3. **Entity Resolution (Relational Integrity):**
   - **Artist Resolution:** Checks if the artist exists by `externalIds.itunes` or `name`. If not found, calls MusicBrainz to enrich country/MBID and creates the `Artist` document.
   - **Album Resolution:** Checks if the collection exists by `externalIds.itunes` or `name`. If not found, creates the `Album` document with `artistIds: [artist._id]`.
   - **Song Upsert:** Uses `findOneAndUpdate({ "externalIds.itunes": itunesTrackId }, { $set: songData }, { upsert: true, new: true, runValidators: true })`. This guarantees **idempotency**: running the import multiple times never creates duplicate songs.

---

## 3. MongoDB Database Architecture

### A. The 6 Collections

#### 1. `users`
- **Fields:** `name` (String, required), `email` (String, unique, lowercase), `password` (bcrypt hash), `image` (String), `favoriteSongs` (`[ObjectId -> songs]`), `createdAt`, `updatedAt`.
- **Key Design Decision:** Password hashes are stripped from all API outputs via `.select('-password')`.

#### 2. `artists`
- **Fields:** `name` (String, required), `bio` (String), `image` (String), `country` (String), `genres` (`[String]`), `externalIds` (Object: `itunes`, `musicbrainz`, `jamendo`, `lastfm`), `createdAt`, `updatedAt`.
- **Purpose:** Decouples artist identity from song and album names.

#### 3. `albums`
- **Fields:** `name` (String, required), `desc` (String), `bgColour` (String), `image` (String), `artistIds` (`[ObjectId -> artists]`), `releaseDate` (Date), `albumType` (String), `externalIds` (Object), `createdAt`, `updatedAt`.
- **Purpose:** Connects albums to artist ObjectIds while preserving the frontend's dynamic background color theming.

#### 4. `songs`
- **Fields:** `name` (String, required), `desc` (String), `albumId` (`ObjectId -> albums`), `album` (String legacy fallback), `artistIds` (`[ObjectId -> artists]`), `genre` (String), `image` (String), `file` (Audio Stream URL), `duration` (Number, seconds), `durationStr` (String), `playCount` (Number, default 0), `isExplicit` (Boolean), `externalIds` (Object), `createdAt`, `updatedAt`.
- **Backward Compatibility:** Keeps the legacy `album` string for existing UI components while establishing the `albumId` ObjectId reference for relational lookups.

#### 5. `playlists`
- **Fields:** `name` (String, required), `description` (String), `userId` (`ObjectId -> users`, required), `songIds` (`[ObjectId -> songs]`), `image` (String), `isPublic` (Boolean, default false), `createdAt`, `updatedAt`.
- **Duplicate Prevention:** Songs are inserted using MongoDB's `$addToSet` operator, preventing duplicate songs within the same playlist.

#### 6. `playhistories`
- **Fields:** `userId` (`ObjectId -> users`, required), `songId` (`ObjectId -> songs`, required), `playedAt` (Date, default `Date.now`), `durationPlayed` (Number, seconds), `createdAt` (Date).
- **Anti-Pattern Prevention:** Kept as a standalone time-series collection rather than an embedded array inside the `User` document. In MongoDB, embedding an unbounded history array inside a document leads to document growth beyond MongoDB's 16 MB limit and degrades write performance.

---

### B. Indexing Strategy

Verified via `db.collection.listIndexes()`:

| Collection | Index Key | Type | Technical Purpose |
|---|---|---|---|
| **`users`** | `{ email: 1 }` | Unique | Prevents duplicate accounts; O(1) login lookups. |
| **`artists`** | `{ name: 1 }` | Normal | Fast text searches for artists. |
| **`artists`** | `{ "externalIds.itunes": 1 }` | Sparse, Unique | Deduplicates API-imported artists. |
| **`artists`** | `{ "externalIds.musicbrainz": 1 }` | Sparse, Unique | Deduplicates MusicBrainz imports. |
| **`albums`** | `{ artistIds: 1 }` | Multi-key | Fast retrieval of albums by artist. |
| **`albums`** | `{ "externalIds.itunes": 1 }` | Sparse, Unique | Prevents duplicate album ingestion. |
| **`songs`** | `{ artistIds: 1 }` | Multi-key | Retrieves all tracks performed by an artist. |
| **`songs`** | `{ albumId: 1 }` | Single-field | Retrieves all tracks belonging to an album. |
| **`songs`** | `{ genre: 1 }` | Single-field | Genre filtering in navigation. |
| **`songs`** | `{ genre: 1, playCount: -1 }` | Compound | Fast retrieval of top-played songs per genre. |
| **`songs`** | `{ "externalIds.itunes": 1 }` | Sparse, Unique | Fast idempotent track upserts. |
| **`playlists`** | `{ userId: 1, createdAt: -1 }` | Compound | Retrieves user playlists sorted by recency. |
| **`playhistories`** | `{ userId: 1, playedAt: -1 }` | Compound | Fetches a user's recent listening history. |
| **`playhistories`** | `{ songId: 1 }` | Single-field | Lookup plays for a specific song. |
| **`playhistories`** | `{ songId: 1, playedAt: -1 }` | Compound | Analytics for trending tracks over time. |

---

### C. Aggregation Framework (`aggregationService.js`)

Real analytical pipelines implemented using MongoDB's aggregation pipeline:

1. **Genre Distribution:** `$group` by genre, `$sum: 1`, `$sort` descending.
2. **Top 10 Songs:** `$sort: { playCount: -1 }`, `$limit: 10`, `$lookup` from `artists`.
3. **Song Count per Artist:** `$lookup` from `songs` on `artistIds`, `$project` with `$size: "$songs"`.
4. **Song Count per Album:** `$lookup` from `songs` on `albumId`, `$project` with `$size: "$songs"`.
5. **Total Listening Time:** `$match: { userId }`, `$group` with `$sum: "$durationPlayed"`.
6. **Daily Listening Activity:** `$match` on date range, `$group` by `$dateToString: { format: "%Y-%m-%d", date: "$playedAt" }`.
7. **Most Active Users:** `$group` by `userId`, `$sort`, `$lookup` from `users`.
8. **Most Played from History:** `$group` by `songId`, `$sort`, `$lookup` from `songs`.
9. **User Playlist Statistics:** `$match: { userId }`, `$project: { songCount: { $size: "$songIds" } }`.
10. **Artist Catalogue:** Multi-stage `$lookup` resolving both `albums` and correlated `songs` per album.

---

## 4. Current Live Database Stats

As verified on **MongoDB Atlas**:
- **Total Songs:** 102 (from Coldplay, Daft Punk, Queen, Taylor Swift, Ed Sheeran, etc.)
- **Total Albums:** 58 (e.g., Parachutes, A Rush of Blood to the Head, Discovery, 1989)
- **Total Artists:** 16 (Deduplicated with iTunes and MusicBrainz IDs)
- **Total Users:** 2
- **Orphaned Songs:** 0 (All songs link to valid Albums and Artists)
- **Test Suite Pass Rate:** 74 / 74 tests passing (100%)

---

## 5. Demonstration Q&A (What Evaluators Will Ask)

### Q1: "Where does the music and audio actually come from? Did you use a CSV or an API?"
> **Answer:** *"We did not use static CSV files. We built an automated, asynchronous ingestion service that connects to live REST APIs. The primary data source is the **Apple iTunes Search API**, which returns real studio-recorded AAC audio streams (`.m4a`), release dates, track numbers, and high-resolution album artwork. We also cross-reference **MusicBrainz** for canonical artist IDs and countries, support Creative Commons tracks via **Jamendo**, and provide a local upload system using Multer."*

### Q2: "Why MongoDB instead of a relational database like PostgreSQL?"
> **Answer:** *"MongoDB was chosen for its flexibility with hierarchical, evolving music metadata:
> 1. Songs have variable nested metadata (`externalIds`, audio formats, licensing tags).
> 2. Document storage matches the JSON responses returned directly by modern REST APIs.
> 3. MongoDB's aggregation framework allows complex analytical pipelines (like listening activity and genre distributions) without slow SQL joins.
> 4. We still maintain relational integrity by using Mongoose ObjectIds (`ref: 'artist'`, `ref: 'album'`) with `.populate()`."*

### Q3: "How do you prevent duplicate songs and artists when importing?"
> **Answer:** *"We use two levels of deduplication:
> 1. **Database Level:** We created **sparse unique compound indexes** on `externalIds.itunes` and `externalIds.musicbrainz`.
> 2. **Application Level:** Our ingestion service uses `findOneAndUpdate` with `{ upsert: true }`. If a song with the same provider ID already exists, MongoDB updates the record rather than creating a duplicate."*

### Q4: "How does the app handle playback history without slowing down the database?"
> **Answer:** *"We designed `playhistories` as an independent collection rather than embedding an array inside the `user` document. In MongoDB, embedding an unbounded array causes document growth, document moving on disk, and eventually hits the 16 MB BSON document limit. Having an independent collection indexed on `{ userId: 1, playedAt: -1 }` gives O(log N) fast reads and prevents document bloat."*

### Q5: "How did you migrate the legacy database without breaking existing features?"
> **Answer:** *"The original codebase stored albums as plain strings (e.g. `album: 'Chill Lo-Fi'`). We wrote an **idempotent migration script** (`migrateDatabase.js`) that:
> 1. Scanned all songs.
> 2. Resolved or created matching `Album` documents.
> 3. Populated the new `albumId` ObjectId reference while leaving the old `album` string intact for backward compatibility.
> 4. Converted duration from strings (`'3:30'`) to integers (210 seconds).
> 5. Created a 'Various Artists' fallback artist so existing tracks had valid foreign references."*

---

## 6. How to Run the Demonstration Live

```bash
# 1. Start the Backend API (Port 4000)
cd backend
npm start

# 2. Start the Frontend UI (Port 5173)
cd ../frontend
npm run dev

# 3. Live Verification Command (Demonstrates MongoDB health and aggregations)
cd ../backend
npm run verify-db

# 4. Live Query Performance Benchmark (Demonstrates index utilization via explain)
npm run perf-test

# 5. Live Automated Test Suite (74 tests)
npm test

# 6. Live Real Music Ingestion (Fetches live data from API on the fly)
node scripts/importMusicData.js --term="Adele" --genre=pop --limit=5
```
