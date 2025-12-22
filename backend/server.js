const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

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

// --- 📰 NEW: NEWS & VIDEO PROXY ROUTES ---

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
    // We send back tracks or albums for the video feed
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
