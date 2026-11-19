import { getTracks } from "./musicProviders/jamendoService.js";
import { searchSongs } from "./musicProviders/itunesService.js";
import { searchArtist as mbSearchArtist } from "./musicProviders/musicBrainzService.js";
import artistModel from "../models/artistModel.js";
import albumModel from "../models/albumModel.js";
import songModel from "../models/songModel.js";

/**
 * Format duration in seconds to "M:SS" string for legacy compatibility.
 */
function formatDurationStr(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * Import music from an external provider (iTunes or Jamendo) into the database.
 * Resolves or creates Artists and Albums before inserting Songs.
 *
 * @param {object} options
 * @param {string} [options.term]        Search term (e.g. "Coldplay", "Rock", "Pop")
 * @param {string} [options.genre]       Genre filter
 * @param {string} [options.artistName]  Artist name filter
 * @param {number} [options.limit=20]    Max tracks to fetch
 * @param {string} [options.source="itunes"] Provider to use ("itunes" or "jamendo")
 * @returns {{ imported: number, skipped: number, errors: Array }}
 */
export async function importMusic(options = {}) {
  const {
    term,
    genre,
    artistName,
    limit = 20,
    source = "itunes",
  } = options;

  const result = { imported: 0, skipped: 0, errors: [] };

  if (source === "jamendo") {
    return importFromJamendo({ genre, artistName, limit }, result);
  }

  // Default & primary real data provider: Apple iTunes Search API (no key required, returns real tracks & audio)
  return importFromItunes({ term: term || artistName || genre || "Top Hits", genre, limit }, result);
}

/**
 * Ingestion from Apple iTunes Search API + MusicBrainz enrichment
 */
async function importFromItunes({ term, genre, limit }, result) {
  let itunesData;
  try {
    itunesData = await searchSongs(term, limit);
  } catch (err) {
    result.errors.push({ step: "fetch_itunes", message: err.message });
    return result;
  }

  const tracks = itunesData.results || [];

  for (const track of tracks) {
    try {
      // Must have trackName and a playable previewUrl or audio URL
      if (!track.trackName || !track.previewUrl) {
        result.skipped++;
        continue;
      }

      const itunesTrackId = String(track.trackId);
      const itunesArtistId = track.artistId ? String(track.artistId) : null;
      const itunesCollectionId = track.collectionId ? String(track.collectionId) : null;

      // 1. Resolve or Create Artist
      let artistDoc = null;
      if (track.artistName) {
        const artistQuery = itunesArtistId
          ? { $or: [{ "externalIds.itunes": itunesArtistId }, { name: track.artistName }] }
          : { name: track.artistName };

        artistDoc = await artistModel.findOne(artistQuery);

        if (!artistDoc) {
          let mbId = null;
          let country = null;
          try {
            const mbRes = await mbSearchArtist(track.artistName, 1);
            if (mbRes?.artists?.length > 0) {
              mbId = mbRes.artists[0].id;
              country = mbRes.artists[0].country || null;
            }
          } catch {
            // Ignore rate limits or MB network errors
          }

          const artistExternalIds = {};
          if (itunesArtistId) artistExternalIds.itunes = itunesArtistId;
          if (mbId) artistExternalIds.musicbrainz = mbId;

          artistDoc = await artistModel.create({
            name: track.artistName,
            country: country || "",
            genres: track.primaryGenreName ? [track.primaryGenreName] : [],
            externalIds: artistExternalIds,
          });
        }
      }

      // 2. Resolve or Create Album
      let albumDoc = null;
      if (track.collectionName) {
        const albumQuery = itunesCollectionId
          ? { $or: [{ "externalIds.itunes": itunesCollectionId }, { name: track.collectionName }] }
          : { name: track.collectionName };

        albumDoc = await albumModel.findOne(albumQuery);

        const highResArt = (track.artworkUrl100 || "").replace("100x100bb.jpg", "600x600bb.jpg");

        if (!albumDoc) {
          const albumExternalIds = {};
          if (itunesCollectionId) albumExternalIds.itunes = itunesCollectionId;

          albumDoc = await albumModel.create({
            name: track.collectionName,
            desc: `${track.artistName || ""} - ${track.collectionName}`,
            bgColour: "#1e1e24",
            image: highResArt || track.artworkUrl100 || "",
            artistIds: artistDoc ? [artistDoc._id] : [],
            releaseDate: track.releaseDate ? new Date(track.releaseDate) : undefined,
            externalIds: albumExternalIds,
          });
        }
      }

      // 3. Upsert Song
      const durationSeconds = track.trackTimeMillis ? Math.round(track.trackTimeMillis / 1000) : 30;
      const highResArt = (track.artworkUrl100 || "").replace("100x100bb.jpg", "600x600bb.jpg");

      const songData = {
        name: track.trackName,
        desc: track.artistName || "Unknown Artist",
        image: highResArt || track.artworkUrl100 || "",
        file: track.previewUrl,
        duration: durationSeconds,
        durationStr: formatDurationStr(durationSeconds),
        genre: track.primaryGenreName?.toLowerCase() || genre || "general",
        releaseDate: track.releaseDate ? new Date(track.releaseDate) : undefined,
        isExplicit: track.trackExplicitness === "explicit",
        externalIds: {
          itunes: itunesTrackId,
        },
        ...(albumDoc ? { albumId: albumDoc._id, album: albumDoc.name } : {}),
        ...(artistDoc ? { artistIds: [artistDoc._id] } : {}),
      };

      await songModel.findOneAndUpdate(
        { "externalIds.itunes": itunesTrackId },
        { $set: songData },
        { upsert: true, new: true, runValidators: true }
      );

      result.imported++;
    } catch (err) {
      result.errors.push({ trackId: track.trackId, trackName: track.trackName, message: err.message });
    }
  }

  return result;
}

/**
 * Ingestion from Jamendo API
 */
async function importFromJamendo({ genre, artistName, limit }, result) {
  const fetchParams = { limit };
  if (genre) fetchParams.tags = genre;
  if (artistName) fetchParams.artist_name = artistName;

  let tracksData;
  try {
    tracksData = await getTracks(fetchParams);
  } catch (err) {
    result.errors.push({ step: "fetch_jamendo", message: err.message });
    return result;
  }

  const tracks = tracksData.results || [];

  for (const track of tracks) {
    try {
      const licenseOk =
        track.audiodownload_allowed === true ||
        (track.license_ccnc && track.license_ccnc !== "");
      if (!licenseOk) {
        result.skipped++;
        continue;
      }

      let artistDoc = null;
      if (track.artist_id) {
        artistDoc = await artistModel.findOneAndUpdate(
          { "externalIds.jamendo": String(track.artist_id) },
          {
            $set: {
              name: track.artist_name || "Unknown Artist",
            },
            $setOnInsert: {
              "externalIds.jamendo": String(track.artist_id),
            },
          },
          { upsert: true, new: true, runValidators: true }
        );
      }

      let albumDoc = null;
      if (track.album_id) {
        albumDoc = await albumModel.findOneAndUpdate(
          { "externalIds.jamendo": String(track.album_id) },
          {
            $set: {
              name: track.album_name || "Unknown Album",
              image: track.album_image || "",
            },
            $setOnInsert: {
              desc: "",
              bgColour: "#000000",
              "externalIds.jamendo": String(track.album_id),
              ...(artistDoc ? { artistIds: [artistDoc._id] } : {}),
            },
          },
          { upsert: true, new: true, runValidators: true }
        );
      }

      const songData = {
        name: track.name,
        desc: track.musicinfo?.tags?.genres?.join(", ") || genre || "",
        image: track.image || "",
        file: track.audiodownload || track.audio || "",
        duration: track.duration ? Number(track.duration) : 0,
        durationStr: formatDurationStr(track.duration ? Number(track.duration) : 0),
        genre: track.musicinfo?.tags?.genres?.[0] || genre || "",
        releaseDate: track.releasedate ? new Date(track.releasedate) : undefined,
        externalIds: { jamendo: String(track.id) },
        ...(albumDoc ? { albumId: albumDoc._id, album: albumDoc.name } : {}),
        ...(artistDoc ? { artistIds: [artistDoc._id] } : {}),
      };

      await songModel.findOneAndUpdate(
        { "externalIds.jamendo": String(track.id) },
        { $set: songData },
        { upsert: true, new: true, runValidators: true }
      );

      result.imported++;
    } catch (err) {
      result.errors.push({ trackId: track.id, trackName: track.name, message: err.message });
    }
  }

  return result;
}

export default importMusic;
