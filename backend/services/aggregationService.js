import mongoose from "mongoose";
import songModel from "../models/songModel.js";
import artistModel from "../models/artistModel.js";
import albumModel from "../models/albumModel.js";
import playHistoryModel from "../models/playHistoryModel.js";
import playlistModel from "../models/playlistModel.js";

// ─── Song / Music Analytics ──────────────────────────────────────────────────

/**
 * Genre distribution: songs grouped by genre, count per genre, sorted desc.
 */
export async function genreDistribution() {
  return songModel.aggregate([
    { $match: { genre: { $exists: true, $ne: "" } } },
    { $group: { _id: "$genre", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, genre: "$_id", count: 1 } },
  ]);
}

/**
 * Top songs by play count (descending), with artist info populated via $lookup.
 * @param {number} limit
 */
export async function topSongs(limit = 10) {
  return songModel.aggregate([
    { $sort: { playCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "artists",
        localField: "artistIds",
        foreignField: "_id",
        as: "artists",
      },
    },
    {
      $project: {
        name: 1,
        genre: 1,
        playCount: 1,
        image: 1,
        artists: { name: 1, _id: 1 },
      },
    },
  ]);
}

/**
 * Song count per artist using $lookup.
 */
export async function artistSongCount() {
  return artistModel.aggregate([
    {
      $lookup: {
        from: "songs",
        localField: "_id",
        foreignField: "artistIds",
        as: "songs",
      },
    },
    {
      $project: {
        name: 1,
        image: 1,
        songCount: { $size: "$songs" },
      },
    },
    { $sort: { songCount: -1 } },
  ]);
}

/**
 * Song count per album using $lookup.
 */
export async function albumSongCount() {
  return albumModel.aggregate([
    {
      $lookup: {
        from: "songs",
        localField: "_id",
        foreignField: "albumId",
        as: "songs",
      },
    },
    {
      $project: {
        name: 1,
        image: 1,
        songCount: { $size: "$songs" },
      },
    },
    { $sort: { songCount: -1 } },
  ]);
}

// ─── Listening / Play History Analytics ──────────────────────────────────────

/**
 * Total listening time (sum of durationPlayed) for a specific user.
 * @param {string|mongoose.Types.ObjectId} userId
 */
export async function totalListeningTimePerUser(userId) {
  const uid =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
  const result = await playHistoryModel.aggregate([
    { $match: { userId: uid } },
    { $group: { _id: "$userId", totalDuration: { $sum: "$durationPlayed" } } },
    { $project: { _id: 0, userId: "$_id", totalDuration: 1 } },
  ]);
  return result[0] || { userId, totalDuration: 0 };
}

/**
 * Daily listening activity for a user over the last N days.
 * @param {string|mongoose.Types.ObjectId} userId
 * @param {number} days
 */
export async function dailyListeningActivity(userId, days = 30) {
  const uid =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
  const since = new Date();
  since.setDate(since.getDate() - days);

  return playHistoryModel.aggregate([
    { $match: { userId: uid, playedAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$playedAt" } },
        plays: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: "$_id", plays: 1 } },
  ]);
}

/**
 * Most active users by total play count.
 * @param {number} limit
 */
export async function mostActiveUsers(limit = 10) {
  return playHistoryModel.aggregate([
    { $group: { _id: "$userId", plays: { $sum: 1 } } },
    { $sort: { plays: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        plays: 1,
        userName: "$user.name",
        userEmail: "$user.email",
      },
    },
  ]);
}

/**
 * Most played songs from play history.
 * @param {number} limit
 */
export async function mostPlayedFromHistory(limit = 10) {
  return playHistoryModel.aggregate([
    { $group: { _id: "$songId", plays: { $sum: 1 } } },
    { $sort: { plays: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "songs",
        localField: "_id",
        foreignField: "_id",
        as: "song",
      },
    },
    { $unwind: { path: "$song", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        songId: "$_id",
        plays: 1,
        songName: "$song.name",
        songImage: "$song.image",
      },
    },
  ]);
}

// ─── Playlist Analytics ───────────────────────────────────────────────────────

/**
 * Playlist stats for a user: each playlist with its song count.
 * @param {string|mongoose.Types.ObjectId} userId
 */
export async function playlistStats(userId) {
  const uid =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
  return playlistModel.aggregate([
    { $match: { userId: uid } },
    {
      $project: {
        name: 1,
        image: 1,
        isPublic: 1,
        songCount: { $size: { $ifNull: ["$songIds", []] } },
      },
    },
    { $sort: { songCount: -1 } },
  ]);
}

// ─── Artist Catalogue ─────────────────────────────────────────────────────────

/**
 * Full artist catalogue: artist info + albums + song count per album.
 * @param {string|mongoose.Types.ObjectId} artistId
 */
export async function artistCatalogue(artistId) {
  const aid =
    typeof artistId === "string" ? new mongoose.Types.ObjectId(artistId) : artistId;

  return artistModel.aggregate([
    { $match: { _id: aid } },
    // Lookup albums for this artist
    {
      $lookup: {
        from: "albums",
        localField: "_id",
        foreignField: "artistIds",
        as: "albums",
      },
    },
    // For each album, count songs
    {
      $addFields: {
        albums: {
          $map: {
            input: "$albums",
            as: "album",
            in: {
              _id: "$$album._id",
              name: "$$album.name",
              image: "$$album.image",
              releaseDate: "$$album.releaseDate",
              albumType: "$$album.albumType",
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: "songs",
        let: { artistId: "$_id" },
        pipeline: [
          { $match: { $expr: { $in: ["$$artistId", "$artistIds"] } } },
          {
            $group: {
              _id: "$albumId",
              songCount: { $sum: 1 },
            },
          },
        ],
        as: "albumSongCounts",
      },
    },
    {
      $addFields: {
        albums: {
          $map: {
            input: "$albums",
            as: "album",
            in: {
              $mergeObjects: [
                "$$album",
                {
                  songCount: {
                    $let: {
                      vars: {
                        match: {
                          $filter: {
                            input: "$albumSongCounts",
                            as: "asc",
                            cond: { $eq: ["$$asc._id", "$$album._id"] },
                          },
                        },
                      },
                      in: {
                        $ifNull: [{ $first: "$$match.songCount" }, 0],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        name: 1,
        bio: 1,
        image: 1,
        country: 1,
        genres: 1,
        externalIds: 1,
        albums: 1,
      },
    },
  ]);
}

// Backward-compat alias used by analyticsController
export { mostActiveUsers as mostActivUsers };
