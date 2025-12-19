const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// 1. Get Trending Artists for the home page (The pictures you wanted)
app.get('/api/artists', async (req, res) => {
  try {
    const response = await axios.get('https://api.deezer.com/chart/0/artists');
    res.json(response.data.data); 
  } catch (err) {
    res.status(500).json({ error: "Deezer API Error" });
  }
});

// 2. Search for any artist
app.get('/api/search/:name', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/search/artist?q=${req.params.name}`);
    res.json(response.data.data);
  } catch (err) {
    res.status(500).json({ error: "Search Error" });
  }
});

// 3. Setup the 10-round game (Plays the song, generates 4 options)
app.get('/api/game/setup/:id', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/artist/${req.params.id}/top?limit=50`);
    const tracks = response.data.data.filter(t => t.preview);
    
    const rounds = tracks.sort(() => 0.5 - Math.random()).slice(0, 10).map(track => {
      const wrong = tracks.filter(t => t.id !== track.id).sort(() => 0.5 - Math.random()).slice(0, 3);
      const choices = [...wrong, track].sort(() => 0.5 - Math.random());
      return {
        preview: track.preview,
        correctId: track.id,
        choices: choices.map(c => ({ id: c.id, title: c.title }))
      };
    });
    res.json(rounds);
  } catch (err) {
    res.status(500).json({ error: "Game Setup Error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => console.log(`Vectflix Backend Live on Port ${PORT}`));
