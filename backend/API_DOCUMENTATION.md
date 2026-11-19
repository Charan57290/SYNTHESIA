# SYNTHESIA — REST API Documentation

**Base URL:** `http://localhost:4000`  
**Content-Type:** `application/json` (all requests and responses)  
**Authentication:** JWT Bearer token — include header `Authorization: Bearer <token>`

---

## Table of Contents

1. [Songs](#songs)
2. [Albums](#albums)
3. [Artists](#artists)
4. [Users](#users)
5. [Playlists](#playlists)
6. [Play History](#play-history)
7. [Analytics](#analytics)
8. [Admin](#admin)

---

## Songs

### `POST /api/song/add`
Upload a new song (multipart form).

| | |
|---|---|
| **Auth** | Not required |
| **Content-Type** | `multipart/form-data` |

**Request Body (form fields):**
```
name        String   required  Track title
desc        String   optional  Description
album       String   optional  Album name (legacy)
image       File     required  Cover art
audio       File     required  Audio file
```

**Response:**
```json
{ "success": true, "message": "Song Added" }
```

---

### `GET /api/song/list`
Return all songs.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "success": true,
  "songs": [
    {
      "_id": "...",
      "name": "Track Title",
      "desc": "...",
      "album": "Album Name",
      "image": "https://...",
      "file": "https://...",
      "duration": 213,
      "genre": "electronic",
      "playCount": 42,
      "artistIds": ["..."],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/song/remove`
Delete a song by ID.

| | |
|---|---|
| **Auth** | Not required |

**Request Body:**
```json
{ "id": "<songId>" }
```

**Response:**
```json
{ "success": true, "message": "Song Removed" }
```

---

### `GET /api/song/search?q=<term>`
Full-text search songs by name or description.

| | |
|---|---|
| **Auth** | Not required |

**Query Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `q` | String | ✅ | Search term |

**Response:**
```json
{
  "success": true,
  "songs": [ { "_id": "...", "name": "...", "genre": "...", "playCount": 10 } ]
}
```

---

### `GET /api/song/popular`
Return the top 20 most-played songs.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "success": true,
  "songs": [
    { "_id": "...", "name": "...", "playCount": 1500, "genre": "pop" }
  ]
}
```

---

### `GET /api/song/genre/:genre`
Return all songs for a given genre.

| | |
|---|---|
| **Auth** | Not required |

**Path Parameters:**
| Param | Description |
|---|---|
| `genre` | Genre string (e.g. `electronic`, `jazz`, `pop`) |

**Response:**
```json
{
  "success": true,
  "genre": "electronic",
  "songs": [ { "_id": "...", "name": "...", "playCount": 300 } ]
}
```

---

## Albums

### `POST /api/album/add`
Upload a new album (multipart form).

| | |
|---|---|
| **Auth** | Not required |
| **Content-Type** | `multipart/form-data` |

**Request Body (form fields):**
```
name        String   required  Album title
desc        String   optional  Description
bgColour    String   optional  HEX background colour
image       File     required  Album art
```

**Response:**
```json
{ "success": true, "message": "Album Added" }
```

---

### `GET /api/album/list`
Return all albums (original route).

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "success": true,
  "albums": [
    {
      "_id": "...",
      "name": "Album Title",
      "desc": "...",
      "bgColour": "#1a1a2e",
      "image": "https://...",
      "artistIds": ["..."],
      "releaseDate": "2023-06-01T00:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/album/remove`
Delete an album by ID.

| | |
|---|---|
| **Auth** | Not required |

**Request Body:**
```json
{ "id": "<albumId>" }
```

**Response:**
```json
{ "success": true, "message": "Album Removed" }
```

---

### `GET /api/albums`
Alias list route returning albums with populated artist data.

| | |
|---|---|
| **Auth** | Not required |

**Response:** Same shape as `GET /api/album/list` with artist names populated.

---

## Artists

### `GET /api/artists`
Return all artists.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "success": true,
  "artists": [
    {
      "_id": "...",
      "name": "Artist Name",
      "bio": "...",
      "image": "https://...",
      "country": "US",
      "genres": ["electronic", "ambient"]
    }
  ]
}
```

---

### `GET /api/artists/:id`
Get a single artist by ID.

| | |
|---|---|
| **Auth** | Not required |

**Path Parameters:**
| Param | Description |
|---|---|
| `id` | Artist ObjectId |

**Response:**
```json
{
  "success": true,
  "artist": {
    "_id": "...",
    "name": "Artist Name",
    "bio": "...",
    "country": "DE",
    "genres": ["techno"],
    "externalIds": { "musicbrainz": "...", "lastfm": "..." }
  }
}
```

**Errors:**
| Status | Body |
|---|---|
| `404` | `{ "success": false, "message": "Artist not found" }` |

---

### `GET /api/artists/:id/songs`
Return all songs by a given artist.

| | |
|---|---|
| **Auth** | Not required |

**Path Parameters:**
| Param | Description |
|---|---|
| `id` | Artist ObjectId |

**Response:**
```json
{
  "success": true,
  "artist": { "_id": "...", "name": "Artist Name" },
  "songs": [ { "_id": "...", "name": "...", "genre": "...", "playCount": 50 } ]
}
```

---

### `GET /api/artists/:id/albums`
Return all albums by a given artist.

| | |
|---|---|
| **Auth** | Not required |

**Path Parameters:**
| Param | Description |
|---|---|
| `id` | Artist ObjectId |

**Response:**
```json
{
  "success": true,
  "artist": { "_id": "...", "name": "Artist Name" },
  "albums": [ { "_id": "...", "name": "...", "releaseDate": "..." } ]
}
```

---

## Users

### `POST /api/user/register`
Register a new user account.

| | |
|---|---|
| **Auth** | Not required |

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{ "success": true, "token": "<jwt>" }
```

**Errors:**
| Status | Body |
|---|---|
| `400` | `{ "success": false, "message": "User already exists" }` |
| `400` | `{ "success": false, "message": "Please enter a valid email" }` |
| `400` | `{ "success": false, "message": "Please enter a strong password" }` |

---

### `POST /api/user/login`
Authenticate and receive a JWT.

| | |
|---|---|
| **Auth** | Not required |

**Request Body:**
```json
{ "email": "jane@example.com", "password": "SecurePass123!" }
```

**Response:**
```json
{ "success": true, "token": "<jwt>" }
```

**Errors:**
| Status | Body |
|---|---|
| `401` | `{ "success": false, "message": "Invalid credentials" }` |

---

### `GET /api/user/profile`
Return the authenticated user's profile.

| | |
|---|---|
| **Auth** | ✅ Required |

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "image": "https://...",
    "favoriteSongs": ["..."]
  }
}
```

---

### `PUT /api/user/profile`
Update the authenticated user's profile.

| | |
|---|---|
| **Auth** | ✅ Required |

**Request Body (all fields optional):**
```json
{ "name": "Jane Doe", "image": "https://..." }
```

**Response:**
```json
{ "success": true, "message": "Profile updated" }
```

---

## Playlists

> [!IMPORTANT]
> All playlist endpoints require authentication (`Authorization: Bearer <token>`).

### `POST /api/playlists`
Create a new playlist.

| | |
|---|---|
| **Auth** | ✅ Required |

**Request Body:**
```json
{
  "name": "My Chill Mix",
  "description": "Evening vibes",
  "isPublic": false
}
```

**Response:**
```json
{
  "success": true,
  "playlist": {
    "_id": "...",
    "name": "My Chill Mix",
    "description": "Evening vibes",
    "userId": "...",
    "songIds": [],
    "isPublic": false,
    "createdAt": "..."
  }
}
```

---

### `GET /api/playlists`
Return the authenticated user's playlists (newest first).

| | |
|---|---|
| **Auth** | ✅ Required |

**Response:**
```json
{
  "success": true,
  "playlists": [ { "_id": "...", "name": "...", "songIds": ["..."], "isPublic": false } ]
}
```

---

### `GET /api/playlists/:id`
Get a playlist by ID. Returns public playlists or playlists owned by the authenticated user.

| | |
|---|---|
| **Auth** | ✅ Required |

**Path Parameters:**
| Param | Description |
|---|---|
| `id` | Playlist ObjectId |

**Response:**
```json
{
  "success": true,
  "playlist": {
    "_id": "...",
    "name": "...",
    "songIds": [ { "_id": "...", "name": "...", "file": "https://..." } ],
    "isPublic": true
  }
}
```

**Errors:**
| Status | Body |
|---|---|
| `403` | `{ "success": false, "message": "Access denied" }` |
| `404` | `{ "success": false, "message": "Playlist not found" }` |

---

### `POST /api/playlists/:id/songs`
Add a song to a playlist.

| | |
|---|---|
| **Auth** | ✅ Required |

**Path Parameters:**
| Param | Description |
|---|---|
| `id` | Playlist ObjectId |

**Request Body:**
```json
{ "songId": "<songId>" }
```

**Response:**
```json
{ "success": true, "message": "Song added to playlist" }
```

---

### `DELETE /api/playlists/:id/songs/:songId`
Remove a song from a playlist.

| | |
|---|---|
| **Auth** | ✅ Required |

**Path Parameters:**
| Param | Description |
|---|---|
| `id` | Playlist ObjectId |
| `songId` | Song ObjectId to remove |

**Response:**
```json
{ "success": true, "message": "Song removed from playlist" }
```

---

## Play History

> [!IMPORTANT]
> All play history endpoints require authentication (`Authorization: Bearer <token>`).

### `POST /api/history`
Record a song play event.

| | |
|---|---|
| **Auth** | ✅ Required |

**Request Body:**
```json
{
  "songId": "<songId>",
  "durationPlayed": 183
}
```

> `durationPlayed` is in seconds. This endpoint also increments `songs.playCount` by 1.

**Response:**
```json
{ "success": true, "message": "Play recorded" }
```

---

### `GET /api/history`
Return the user's listening history (last 50 plays, newest first).

| | |
|---|---|
| **Auth** | ✅ Required |

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "_id": "...",
      "songId": { "_id": "...", "name": "Track Name", "image": "https://..." },
      "playedAt": "2024-07-10T22:14:00.000Z",
      "durationPlayed": 183
    }
  ]
}
```

---

### `GET /api/history/recent`
Return the user's 10 most recent plays.

| | |
|---|---|
| **Auth** | ✅ Required |

**Response:** Same shape as `GET /api/history`, limited to 10 entries.

---

## Analytics

### `GET /api/analytics/genres`
Genre distribution across all songs.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "success": true,
  "genres": [
    { "genre": "electronic", "count": 142 },
    { "genre": "pop", "count": 98 }
  ]
}
```

---

### `GET /api/analytics/top-songs`
Top 10 songs by total play count.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "success": true,
  "songs": [
    { "_id": "...", "name": "Hit Track", "playCount": 5420, "genre": "pop" }
  ]
}
```

---

### `GET /api/analytics/top-artists`
Artists ranked by number of songs in the catalogue.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "success": true,
  "artists": [
    { "_id": "...", "name": "Top Artist", "songCount": 34 }
  ]
}
```

---

### `GET /api/analytics/listening`
Total and daily listening stats for the authenticated user.

| | |
|---|---|
| **Auth** | ✅ Required |

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalPlays": 320,
    "totalDurationSeconds": 68400,
    "dailyBreakdown": [
      { "date": "2024-07-10", "plays": 12, "durationSeconds": 2580 }
    ]
  }
}
```

---

### `GET /api/analytics/active-users`
Most active users ranked by total play count.

| | |
|---|---|
| **Auth** | Not required |

**Response:**
```json
{
  "success": true,
  "users": [
    { "_id": "...", "name": "Power Listener", "totalPlays": 890 }
  ]
}
```

---

## Admin

> [!CAUTION]
> Admin endpoints require authentication. In production, restrict these routes to admin-role users only.

### `POST /api/admin/import/music`
Trigger a music import from an external provider.

| | |
|---|---|
| **Auth** | ✅ Required |

**Request Body:**
```json
{
  "genre": "electronic",
  "artistName": "Aphex Twin",
  "limit": 20,
  "source": "jamendo"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `genre` | String | — | Genre filter |
| `artistName` | String | — | Artist filter |
| `limit` | Number | — | Max tracks to import (default: 20) |
| `source` | String | — | `"jamendo"` \| `"musicbrainz"` \| `"itunes"` \| `"lastfm"` |

**Response:**
```json
{
  "success": true,
  "message": "Import complete",
  "imported": 18,
  "skipped": 2
}
```

---

### `GET /api/admin/import/status`
Check the health / availability of all external music API services.

| | |
|---|---|
| **Auth** | ✅ Required |

**Response:**
```json
{
  "success": true,
  "services": {
    "jamendo": { "status": "ok", "clientId": "configured" },
    "musicbrainz": { "status": "ok" },
    "itunes": { "status": "ok" },
    "lastfm": { "status": "ok", "apiKey": "configured" }
  }
}
```

---

## Error Responses

All endpoints return a consistent error envelope:

```json
{ "success": false, "message": "Human-readable error description" }
```

| HTTP Status | Meaning |
|---|---|
| `400` | Bad request / validation error |
| `401` | Missing or invalid JWT |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `500` | Internal server error |
