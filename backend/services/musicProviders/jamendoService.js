import axios from "axios";

const JAMENDO_BASE = "https://api.jamendo.com/v3.0";
const TIMEOUT = 15000;

const jamendoClient = axios.create({
  baseURL: JAMENDO_BASE,
  timeout: TIMEOUT,
});

function getClientId() {
  const id = process.env.JAMENDO_CLIENT_ID;
  if (!id) {
    throw new Error("JAMENDO_CLIENT_ID is not set in environment variables");
  }
  return id;
}

/**
 * Returns true if the track can be used (download allowed or CC license that permits streaming).
 * @param {object} track
 */
function isTrackUsable(track) {
  if (track.audiodownload_allowed === true) return true;
  // Check license shortname for common CC streaming-allowed licenses
  const license = (track.license_ccnc || track.license || "").toLowerCase();
  const streamingOk = ["cc-by", "cc-by-sa", "cc-by-nd", "cc0", "public domain"].some((l) =>
    license.includes(l)
  );
  return streamingOk;
}

/**
 * Fetch tracks from Jamendo.
 * @param {object} params  Additional query params (e.g. tags, search, artist_name)
 */
export async function getTracks(params = {}) {
  try {
    const response = await jamendoClient.get("/tracks/", {
      params: {
        client_id: getClientId(),
        format: "json",
        audioformat: "mp32",
        include: "licenses+musicinfo",
        limit: 20,
        ...params,
      },
    });
    const data = response.data;
    // Filter to tracks that are usable
    if (data.results) {
      data.results = data.results.filter(isTrackUsable);
    }
    return data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`Jamendo getTracks failed: ${msg}`);
  }
}

/**
 * Fetch albums from Jamendo.
 * @param {object} params
 */
export async function getAlbums(params = {}) {
  try {
    const response = await jamendoClient.get("/albums/", {
      params: {
        client_id: getClientId(),
        format: "json",
        include: "tracks",
        limit: 10,
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`Jamendo getAlbums failed: ${msg}`);
  }
}

/**
 * Fetch artists from Jamendo.
 * @param {object} params
 */
export async function getArtists(params = {}) {
  try {
    const response = await jamendoClient.get("/artists/", {
      params: {
        client_id: getClientId(),
        format: "json",
        limit: 10,
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data || error.message;
    throw new Error(`Jamendo getArtists failed: ${msg}`);
  }
}
