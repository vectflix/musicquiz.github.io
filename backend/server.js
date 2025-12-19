const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// 1. Get trending artists for the home page
app.get('/api/artists', async (req, res) => {
  try {
    const response = await axios.get('https://api.deezer.com/chart/0/artists');
    res.json(response.data.data);
  } catch (err) { res.status(500).json({ error: "Deezer API Error" }); }
});

// 2. Search for any artist
app.get('/api/search/:name', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/search/artist?q=${req.params.name}`);
    res.json(response.data.data);
  } catch (err) { res.status(500).json({ error: "Search Error" }); }
});

// 3. Generate 10 rounds of music guessing
app.get('/api/game/setup/:id', async (req, res) => {
  try {
    const artistTracks = await axios.get(`https://api.deezer.com/artist/${req.params.id}/top?limit=50`);
    const tracks = artistTracks.data.data.filter(t => t.preview);
    
    const rounds = tracks.slice(0, 10).map(track => {
      const wrong = tracks.filter(t => t.id !== track.id).sort(() => 0.5 - Math.random()).slice(0, 3);
      const choices = [...wrong, track].sort(() => 0.5 - Math.random());
      return {
        preview: track.preview,
        correctId: track.id,
        choices: choices.map(c => ({ id: c.id, title: c.title }))
      };
    });
    res.json(rounds);
  } catch (err) { res.status(500).json({ error: "Game Setup Error" }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => console.log(`Backend running on port ${PORT}`));
