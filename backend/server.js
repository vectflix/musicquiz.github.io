const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// --- SPOTIFY CONFIG (Add these to your Render Environment Variables) ---
const SPOT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// Path to persistent leaderboard file
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

// --- Helper functions ---
const readLeaderboard = () => {
  try {
    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeLeaderboard = (data) => {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Helper: Get Spotify Access Token (Client Credentials Flow)
const getSpotifyToken = async () => {
  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    const authHeader = Buffer.from(`${SPOT_ID}:${SPOT_SECRET}`).toString('base64');
    
    const res = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return res.data.access_token;
  } catch (err) {
    console.error("Spotify Auth Error:", err.message);
    return null;
  }
};

// --- 🎵 MUSIC API ROUTES ---

// 1. Trending artists (Game Home)
app.get('/api/artists', async (req, res) => {
  try {
    const response = await axios.get('https://api.deezer.com/chart/0/artists');
    res.json(response.data.data);
  } catch (err) { 
    res.status(500).json({ error: "Deezer API Error" }); 
  }
});

// 2. Search artists globally
app.get('/api/search/artists', async (req, res) => {
  const query = req.query.q || req.params.name;
  if (!query) return res.json([]);
  try {
    const response = await axios.get(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}`);
    res.json(response.data.data);
  } catch (err) { 
    res.status(500).json({ error: "Search Error" }); 
  }
});

// 3. Game setup for quiz
app.get('/api/game/setup/:artistId', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/artist/${req.params.artistId}/top?limit=50`);
    if (!response.data.data || response.data.data.length === 0) {
      return res.status(404).json({ error: "No tracks found for this artist" });
    }

    const tracksWithAudio = response.data.data.filter(t => t.preview && t.preview.length > 0);
    if (tracksWithAudio.length < 10) {
      return res.status(400).json({ error: "Not enough audio tracks for a quiz" });
    }

    const rounds = tracksWithAudio.sort(() => 0.5 - Math.random()).slice(0, 10).map(track => {
      const others = tracksWithAudio
        .filter(t => t.id !== track.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const choices = [...others, track].sort(() => 0.5 - Math.random());

      return {
        preview: track.preview,
        title: track.title,
        correctId: track.id,
        choices: choices.map(c => ({ id: c.id, title: c.title }))
      };
    });

    res.json(rounds);
  } catch (err) {
    res.status(500).json({ error: "Game Setup Error" });
  }
});

// --- 📈 NEW: SPOTIFY TOP STREAMED ROUTE ---

app.get('/api/spotify/top-streamed', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    if (!token) throw new Error("Auth Failed");

    // Get Global Top 50 Playlist to find trending artists
    const playlistRes = await axios.get('https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDm3pk3s', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Extract unique artist IDs from the tracks
    const artistIds = [...new Set(playlistRes.data.tracks.items.map(i => i.track.artists[0].id))].slice(0, 15);

    // Get full artist details (images, followers, popularity)
    const artistsRes = await axios.get(`https://api.spotify.com/v1/artists?ids=${artistIds.join(',')}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const formattedData = artistsRes.data.artists.map(artist => ({
      name: artist.name,
      image: artist.images[0]?.url,
      followers: artist.followers.total,
      // Spotify API doesn't give monthly listeners directly, so we use Popularity (0-100) 
      // or an estimate based on followers for the UI
      popularity: artist.popularity,
      link: artist.external_urls.spotify
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Spotify Sync Error:", err.message);
    res.status(500).json({ error: "Failed to fetch Spotify data" });
  }
});

// --- 📰 NEWS & VIDEO PROXY ROUTES ---

// 4. Global Music News (Billboard RSS to JSON)
app.get('/api/news', async (req, res) => {
  try {
    const response = await axios.get("https://api.rss2json.com/v1/api.json?rss_url=https://www.billboard.com/c/music/feed/");
    res.json(response.data.items || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch music news" });
  }
});

// 5. Trending Charts (For Video Feed)
app.get('/api/trending', async (req, res) => {
  try {
    const response = await axios.get("https://api.deezer.com/editorial/0/charts");
    res.json(response.data.tracks?.data || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trending videos" });
  }
});

// --- 📈 LEADERBOARD ROUTES ---

app.get('/api/leaderboard', (req, res) => {
  const leaderboard = readLeaderboard();
  res.json(leaderboard);
});

app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  if (!name || score === undefined) {
    return res.status(400).json({ error: "Invalid data" });
  }

  const leaderboard = readLeaderboard();
  leaderboard.push({ name, score, date: new Date().toLocaleDateString() });

  const sorted = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
  writeLeaderboard(sorted);

  res.json(sorted);
});

// --- 🚀 SERVER LAUNCH ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`VECTFLIX Peak Server running on port ${PORT}`);
});
