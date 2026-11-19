// scripts/testEndpoints.js
// Tests live API endpoints on the running server
import axios from 'axios';

const BASE_URL = 'http://localhost:4000';

async function runTests() {
  console.log('🚀 Testing API Endpoints on', BASE_URL);
  let passed = 0;
  let failed = 0;

  async function check(name, fn) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ ${name}:`, err.response?.data || err.message);
      failed++;
    }
  }

  // 1. Health check
  await check('GET / (API health check)', async () => {
    const res = await axios.get(`${BASE_URL}/`);
    if (res.data !== 'API Working') throw new Error(`Unexpected response: ${res.data}`);
  });

  // 2. Existing song list
  let sampleSongId = null;
  await check('GET /api/song/list', async () => {
    const res = await axios.get(`${BASE_URL}/api/song/list`);
    if (!res.data.success || !Array.isArray(res.data.songs) || res.data.songs.length === 0) {
      throw new Error('Expected songs array');
    }
    sampleSongId = res.data.songs[0]._id;
  });

  // 3. Existing album list
  await check('GET /api/album/list', async () => {
    const res = await axios.get(`${BASE_URL}/api/album/list`);
    if (!res.data.success || !Array.isArray(res.data.albums) || res.data.albums.length === 0) {
      throw new Error('Expected albums array');
    }
  });

  // 4. New Artist list
  let sampleArtistId = null;
  await check('GET /api/artists', async () => {
    const res = await axios.get(`${BASE_URL}/api/artists`);
    if (!res.data.success || !Array.isArray(res.data.artists)) throw new Error('Expected artists array');
    sampleArtistId = res.data.artists[0]?._id;
  });

  // 5. New Song search
  await check('GET /api/song/search?q=tiger', async () => {
    const res = await axios.get(`${BASE_URL}/api/song/search?q=tiger`);
    if (!res.data.success || res.data.songs.length === 0) throw new Error('Search failed');
  });

  // 6. New Song popular
  await check('GET /api/song/popular', async () => {
    const res = await axios.get(`${BASE_URL}/api/song/popular`);
    if (!res.data.success || !Array.isArray(res.data.songs)) throw new Error('Popular failed');
  });

  // 7. New Song by genre
  await check('GET /api/song/genre/rock', async () => {
    const res = await axios.get(`${BASE_URL}/api/song/genre/rock`);
    if (!res.data.success || res.data.songs.length === 0) throw new Error('Genre search failed');
  });

  // 8. Analytics endpoints
  await check('GET /api/analytics/genres', async () => {
    const res = await axios.get(`${BASE_URL}/api/analytics/genres`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Analytics genres failed');
  });

  await check('GET /api/analytics/top-songs', async () => {
    const res = await axios.get(`${BASE_URL}/api/analytics/top-songs`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Analytics top-songs failed');
  });

  await check('GET /api/analytics/top-artists', async () => {
    const res = await axios.get(`${BASE_URL}/api/analytics/top-artists`);
    if (!res.data.success || !Array.isArray(res.data.data)) throw new Error('Analytics top-artists failed');
  });

  // 9. User Registration and Auth
  const testEmail = `tester_${Date.now()}@example.com`;
  let token = null;

  await check('POST /api/user/register', async () => {
    const res = await axios.post(`${BASE_URL}/api/user/register`, {
      name: 'Test Listener',
      email: testEmail,
      password: 'password1234',
    });
    if (!res.data.success || !res.data.token) throw new Error('Registration failed: ' + res.data.message);
    token = res.data.token;
  });

  await check('GET /api/user/profile (Authenticated)', async () => {
    const res = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { token },
    });
    if (!res.data.success || res.data.userData.email !== testEmail) throw new Error('Profile failed');
  });

  // 10. Playlists
  let playlistId = null;
  await check('POST /api/playlists (Create playlist)', async () => {
    const res = await axios.post(
      `${BASE_URL}/api/playlists`,
      { name: 'My Test Playlist', description: 'Favorites', isPublic: true },
      { headers: { token } }
    );
    if (!res.data.success || !res.data.playlist) throw new Error('Create playlist failed');
    playlistId = res.data.playlist._id;
  });

  if (playlistId && sampleSongId) {
    await check('POST /api/playlists/:id/songs (Add song)', async () => {
      const res = await axios.post(
        `${BASE_URL}/api/playlists/${playlistId}/songs`,
        { songId: sampleSongId },
        { headers: { token } }
      );
      if (!res.data.success) throw new Error('Add song to playlist failed');
    });
  }

  // 11. Play History
  if (sampleSongId) {
    await check('POST /api/history (Record play)', async () => {
      const res = await axios.post(
        `${BASE_URL}/api/history`,
        { songId: sampleSongId, durationPlayed: 180 },
        { headers: { token } }
      );
      if (!res.data.success) throw new Error('Record play failed');
    });

    await check('GET /api/history (Get history)', async () => {
      const res = await axios.get(`${BASE_URL}/api/history`, {
        headers: { token },
      });
      if (!res.data.success || res.data.history.length === 0) throw new Error('Get history failed');
    });
  }

  console.log(`\n================================`);
  console.log(`Endpoints Passed: ${passed}, Failed: ${failed}`);
  console.log(`================================`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
