const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// --- CONFIG ---
const LASTFM_KEY = '982e349c8a6d19ddeb9c5244939130ec'; 
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');
const BILLBOARD_RSS = "https://www.billboard.com/feed/";

const readLeaderboard = () => {
  try {
    if (!fs.existsSync(LEADERBOARD_FILE)) return [];
    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) { return []; }
};

const writeLeaderboard = (data) => {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// --- ROUTES ---

// Billboard News (Proxied to avoid CORS)
app.get('/api/news', async (req, res) => {
  try {
    const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(BILLBOARD_RSS)}`);
    res.json(response.data.items || []); 
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Billboard news" });
  }
});

// Deezer Artist Search
app.get('/api/search/artists', async (req, res) => {
  const query = req.query.q || "";
  try {
    const response = await axios.get(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}`);
    res.json(response.data.data);
  } catch (err) { res.status(500).json({ error: "Search Error" }); }
});

// Game Setup (10 Rounds)
app.get('/api/game/setup/:artistId', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/artist/${req.params.artistId}/top?limit=50`);
    const tracksWithAudio = (response.data.data || []).filter(t => t.preview);
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
  } catch (err) { res.status(500).json({ error: "Setup Error" }); }
});

// Leaderboard Routes
app.get('/api/leaderboard', (req, res) => res.json(readLeaderboard()));
app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  let leaderboard = readLeaderboard();
  leaderboard.push({ name, score, date: new Date().toLocaleDateString() });
  leaderboard = leaderboard.sort((a, b) => b.score - a.score).slice(0, 10);
  writeLeaderboard(leaderboard);
  res.json(leaderboard);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ PEAK Server running on port ${PORT}`));
