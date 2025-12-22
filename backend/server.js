const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// --- SPOTIFY CONFIG ---
const SPOT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

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

// Helper: Get Spotify Access Token
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

app.get('/api/artists', async (req, res) => {
  try {
    const response = await axios.get('https://api.deezer.com/chart/0/artists');
    res.json(response.data.data);
  } catch (err) { 
    res.status(500).json({ error: "Deezer API Error" }); 
  }
});

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

app.get('/api/game/setup/:artistId', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/artist/${req.params.artistId}/top?limit=50`);
    if (!response.data.data || response.data.data.length === 0) {
      return res.status(404).json({ error: "No tracks found" });
    }
    const tracksWithAudio = response.data.data.filter(t => t.preview && t.preview.length > 0);
    if (tracksWithAudio.length < 10) {
      return res.status(400).json({ error: "Not enough tracks" });
    }
    const rounds = tracksWithAudio.sort(() => 0.5 - Math.random()).slice(0, 10).map(track => {
      const others = tracksWithAudio.filter(t => t.id !== track.id).sort(() => 0.5 - Math.random()).slice(0, 3);
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

// --- 📈 FIXED SPOTIFY ROUTE ---

app.get('/api/spotify/top-streamed', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    if (!token) return res.status(500).json({ error: "Spotify Auth Failed" });

    // 1. Get Global Top 50 Playlist (Correct ID: 37i9dQZEVXbMDoHDwfs2tF)
    const playlistRes = await axios.get('https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwfs2tF', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const items = playlistRes.data.tracks.items || [];
    const artistIds = [...new Set(items.map(i => i.track.artists[0].id))].slice(0, 15);

    // 2. FIXED: Added the '$' symbol to make the URL dynamic
    const artistsRes = await axios.get(`https://api.spotify.com/v1/artists?ids=${artistIds.join(',')}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const formattedData = artistsRes.data.artists.map(artist => ({
      name: artist.name,
      image: artist.images[0]?.url,
      followers: artist.followers.total,
      popularity: artist.popularity,
      link: artist.external_urls.spotify
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("Spotify Sync Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch Spotify data" });
  }
});

// --- 📰 NEWS & VIDEO ---

app.get('/api/news', async (req, res) => {
  try {
    const response = await axios.get("https://api.rss2json.com/v1/api.json?rss_url=https://www.billboard.com/c/music/feed/");
    res.json(response.data.items || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch music news" });
  }
});

app.get('/api/trending', async (req, res) => {
  try {
    const response = await axios.get("https://api.deezer.com/editorial/0/charts");
    res.json(response.data.tracks?.data || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trending videos" });
  }
});

// --- 📈 LEADERBOARD ---

app.get('/api/leaderboard', (req, res) => {
  res.json(readLeaderboard());
});

app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  if (!name || score === undefined) return res.status(400).json({ error: "Invalid data" });
  const leaderboard = readLeaderboard();
  leaderboard.push({ name, score, date: new Date().toLocaleDateString() });
  const sorted = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
  writeLeaderboard(sorted);
  res.json(sorted);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`VECTFLIX Peak Server running on port ${PORT}`);
});
