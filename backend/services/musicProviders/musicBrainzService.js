import axios from "axios";

const MUSICBRAINZ_BASE = "https://musicbrainz.org/ws/2";
const TIMEOUT = 10000;

const userAgent =
  process.env.MUSICBRAINZ_USER_AGENT || "SYNTHESIA/1.0";

const mbClient = axios.create({
  baseURL: MUSICBRAINZ_BASE,
  timeout: TIMEOUT,
  headers: {
    "User-Agent": userAgent,
    Accept: "application/json",
  },
});

// 1-second delay between requests (MusicBrainz rate limit: 1 req/sec)
const delay = (ms = 1000) => new Promise((res) => setTimeout(res, ms));

let lastRequestTime = 0;

async function throttledGet(url, params) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1000) {
    await delay(1000 - elapsed);
  }
  lastRequestTime = Date.now();
  return mbClient.get(url, { params });
}

/**
 * Search for artists by name.
 * @param {string} name
 * @param {number} limit
 */
export async function searchArtist(name, limit = 5) {
  try {
    const response = await throttledGet("/artist/", {
      query: `artist:${name}`,
      fmt: "json",
      limit,
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`MusicBrainz searchArtist failed: ${msg}`);
  }
}

/**
 * Search for releases by artist name.
 * @param {string} artistName
 * @param {number} limit
 */
export async function searchRelease(artistName, limit = 5) {
  try {
    const response = await throttledGet("/release/", {
      query: `artist:${artistName}`,
      fmt: "json",
      limit,
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`MusicBrainz searchRelease failed: ${msg}`);
  }
}

/**
 * Search for recordings (tracks) by query string.
 * @param {string} query
 * @param {number} limit
 */
export async function searchRecording(query, limit = 10) {
  try {
    const response = await throttledGet("/recording/", {
      query,
      fmt: "json",
      limit,
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`MusicBrainz searchRecording failed: ${msg}`);
  }
}
