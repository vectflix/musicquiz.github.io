const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// --- 🏆 PEAK LEADERBOARD DATABASE (In-Memory) ---
// Note: This resets if the server restarts. 
let globalLeaderboard = [
  { name: "VECTFLIX_KING", score: 10 },
  { name: "MusicPro", score: 8 },
  { name: "Guest_77", score: 6 }
];

// --- 🎵 MUSIC API ROUTES ---

// Get trending artists for the home screen
app.get('/api/artists', async (req, res) => {
  try {
    const response = await axios.get('https://api.deezer.com/chart/0/artists');
    res.json(response.data.data);
  } catch (err) { 
    res.status(500).json({ error: "Deezer API Error" }); 
  }
});

// Search for specific artists
app.get('/api/search/:name', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/search/artist?q=${req.params.name}`);
    res.json(response.data.data);
  } catch (err) { 
    res.status(500).json({ error: "Search Error" }); 
  }
});

// Setup 10-round game data for a specific artist
app.get('/api/game/setup/:artistId', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/artist/${req.params.artistId}/top?limit=50`);
    const tracks = response.data.data.filter(t => t.preview);
    
    const rounds = tracks.sort(() => 0.5 - Math.random()).slice(0, 10).map(track => {
      const others = tracks.filter(t => t.id !== track.id).sort(() => 0.5 - Math.random()).slice(0, 3);
      const choices = [...others, track].sort(() => 0.5 - Math.random());
      return { 
        preview: track.preview, 
        title: track.title, 
        correctId: track.id, 
        choices 
      };
    });
    res.json(rounds);
  } catch (err) { 
    res.status(500).json({ error: "Game Setup Error" }); 
  }
});

// --- 📈 LEADERBOARD ROUTES ---

// Fetch the current Top 5
app.get('/api/leaderboard', (req, res) => {
  res.json(globalLeaderboard);
});

// Submit a new score and update the Top 5
app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  
  if (!name || score === undefined) {
    return res.status(400).json({ error: "Invalid data" });
  }

  // Add new entry, sort high-to-low, and keep only top 5
  globalLeaderboard.push({ name, score });
  globalLeaderboard = globalLeaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  res.json(globalLeaderboard);
});

// --- 🚀 SERVER LAUNCH ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Peak Server running on port ${PORT}`);
});
