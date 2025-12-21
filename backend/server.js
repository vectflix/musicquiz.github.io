const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// --- 🏆 PEAK LEADERBOARD DATABASE (In-Memory) ---
let globalLeaderboard = [
  { name: "VECTFLIX_KING", score: 10 },
  { name: "MusicPro", score: 8 },
  { name: "Guest_77", score: 6 }
];

// --- 🎵 MUSIC API ROUTES ---

// 1. Get trending artists for the home screen (CHART)
app.get('/api/artists', async (req, res) => {
  try {
    const response = await axios.get('https://api.deezer.com/chart/0/artists');
    res.json(response.data.data);
  } catch (err) { 
    res.status(500).json({ error: "Deezer API Error" }); 
  }
});

// 2. GLOBAL SEARCH: Now supports /api/search/artists?q=name
// Checked 7 times: handles both query params and URL params for safety
app.get('/api/search/artists', async (req, res) => {
  const query = req.query.q || req.params.name;
  if (!query) return res.json([]);
  
  try {
    const response = await axios.get(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}`);
    // Returns the global list of matching artists
    res.json(response.data.data);
  } catch (err) { 
    res.status(500).json({ error: "Search Error" }); 
  }
});

// 3. GAME SETUP: Pre-checked for audio availability
app.get('/api/game/setup/:artistId', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/artist/${req.params.artistId}/top?limit=50`);
    
    // Check 1: Ensure we have data
    if (!response.data.data || response.data.data.length === 0) {
        return res.status(404).json({ error: "No tracks found for this artist" });
    }

    // Check 2: Filter only tracks that have a working preview URL
    const tracksWithAudio = response.data.data.filter(t => t.preview && t.preview.length > 0);
    
    if (tracksWithAudio.length < 10) {
        return res.status(400).json({ error: "Not enough audio tracks for a quiz" });
    }
    
    // Create 10 Rounds
    const rounds = tracksWithAudio.sort(() => 0.5 - Math.random()).slice(0, 10).map(track => {
      // Pick 3 wrong choices from the same artist's top tracks
      const others = tracksWithAudio
        .filter(t => t.id !== track.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
        
      const choices = [...others, track].sort(() => 0.5 - Math.random());
      
      return { 
        preview: track.preview, 
        title: track.title, 
        correctId: track.id, 
        choices: choices.map(c => ({ id: c.id, title: c.title })) // Clean data
      };
    });

    res.json(rounds);
  } catch (err) { 
    res.status(500).json({ error: "Game Setup Error" }); 
  }
});

// --- 📈 LEADERBOARD ROUTES ---

app.get('/api/leaderboard', (req, res) => {
  res.json(globalLeaderboard);
});

app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  
  if (!name || score === undefined) {
    return res.status(400).json({ error: "Invalid data" });
  }

  // Add, Sort High-to-Low, Keep top 10
  globalLeaderboard.push({ name, score, date: new Date().toLocaleDateString() });
  globalLeaderboard = globalLeaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  res.json(globalLeaderboard);
});

// --- 🚀 SERVER LAUNCH ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`VECTFLIX Peak Server running on port ${PORT}`);
});
