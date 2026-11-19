import axios from "axios";

const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";
const TIMEOUT = 10000;

const lastFmClient = axios.create({
  baseURL: LASTFM_BASE,
  timeout: TIMEOUT,
});

function getApiKey() {
  const key = process.env.LASTFM_API_KEY;
  if (!key) {
    throw new Error("LASTFM_API_KEY is not set in environment variables");
  }
  return key;
}

/**
 * Search for a track on Last.fm.
 * @param {string} track  Track name
 * @param {string} artist Optional artist name to narrow results
 * @param {number} limit
 */
export async function searchTrack(track, artist = "", limit = 10) {
  try {
    const params = {
      method: "track.search",
      track,
      limit,
      format: "json",
      api_key: getApiKey(),
    };
    if (artist) params.artist = artist;
    const response = await lastFmClient.get("", { params });
    return response.data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`Last.fm searchTrack failed: ${msg}`);
  }
}

/**
 * Search for an artist on Last.fm.
 * @param {string} artist
 * @param {number} limit
 */
export async function searchArtist(artist, limit = 5) {
  try {
    const response = await lastFmClient.get("", {
      params: {
        method: "artist.search",
        artist,
        limit,
        format: "json",
        api_key: getApiKey(),
      },
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`Last.fm searchArtist failed: ${msg}`);
  }
}

/**
 * Get chart top tracks from Last.fm.
 * @param {number} limit
 */
export async function getTopTracks(limit = 10) {
  try {
    const response = await lastFmClient.get("", {
      params: {
        method: "chart.getTopTracks",
        limit,
        format: "json",
        api_key: getApiKey(),
      },
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`Last.fm getTopTracks failed: ${msg}`);
  }
}
