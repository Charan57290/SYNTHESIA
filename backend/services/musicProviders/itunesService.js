import axios from "axios";

const ITUNES_BASE = "https://itunes.apple.com";
const TIMEOUT = 10000;

const itunesClient = axios.create({
  baseURL: ITUNES_BASE,
  timeout: TIMEOUT,
});

/**
 * Search for songs on iTunes.
 * @param {string} term
 * @param {number} limit
 */
export async function searchSongs(term, limit = 20) {
  try {
    const response = await itunesClient.get("/search", {
      params: { term, entity: "song", limit },
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`iTunes searchSongs failed: ${msg}`);
  }
}

/**
 * Search for albums on iTunes.
 * @param {string} term
 * @param {number} limit
 */
export async function searchAlbums(term, limit = 10) {
  try {
    const response = await itunesClient.get("/search", {
      params: { term, entity: "album", limit },
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`iTunes searchAlbums failed: ${msg}`);
  }
}

/**
 * Search for artists on iTunes.
 * @param {string} term
 * @param {number} limit
 */
export async function searchArtists(term, limit = 5) {
  try {
    const response = await itunesClient.get("/search", {
      params: { term, entity: "musicArtist", limit },
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`iTunes searchArtists failed: ${msg}`);
  }
}
