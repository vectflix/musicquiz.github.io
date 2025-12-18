const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// 1. Robust CORS setup to allow your Vercel frontend to talk to this server
app.use(cors());
app.use(express.json());

// 2. Initial Trending Artists Route
app.get('/api/artists', async (req, res) => {
  try {
    const response = await axios.get('https://api.deezer.com/chart/0/artists');
    console.log("Fetched trending artists successfully");
    res.json(response.data.data);
  } catch (error) {
    console.error("Error fetching trending artists:", error.message);
    res.status(500).json({ error: "Failed to fetch artists" });
  }
});

// 3. Search Artists Route
app.get('/api/search/:name', async (req, res) => {
  try {
    const name = req.params.name;
    const response = await axios.get(`https://api.deezer.com/search/artist?q=${name}`);
    console.log(`Search performed for: ${name}`);
    res.json(response.data.data);
  } catch (error) {
    console.error("Search error:", error.message);
    res.status(500).json({ error: "Search failed" });
  }
});

// 4. Setup 10 Unique Game Rounds
app.get('/api/game/setup/:artistId', async (req, res) => {
  try {
    const artistId = req.params.artistId;
    const response = await axios.get(`https://api.deezer.com/artist/${artistId}/top?limit=50`);
    const allTracks = response.data.data;

    if (!allTracks || allTracks.length < 10) {
      return res.status(400).json({ error: "Artist doesn't have enough songs for 10 rounds" });
    }
    
    // Shuffle and pick 10 unique tracks
    const shuffledTracks = allTracks.sort(() => 0.5 - Math.random());
    const gameRounds = [];

    for(let i=0; i < 10; i++) {
        const correctTrack = shuffledTracks[i];
        // Pick 3 wrong choices from other tracks in the top 50
        const others = shuffledTracks
            .filter(t => t.id !== correctTrack.id)
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
            
        const choices = [correctTrack, ...others].sort(() => 0.5 - Math.random());
        
        gameRounds.push({
            correctId: correctTrack.id,
            preview: correctTrack.preview,
            title: correctTrack.title,
            cover: correctTrack.album.cover_medium,
            choices: choices.map(c => ({ id: c.id, title: c.title }))
        });
    }
    res.json(gameRounds);
  } catch (error) {
    console.error("Game setup error:", error.message);
    res.status(500).json({ error: "Failed to setup game" });
  }
});

// 5. Keep-Alive Ping Route
// Point your Cron-job here: https://your-backend.onrender.com/ping
app.get('/ping', (req, res) => {
  res.send('pong');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend should connect to: ${process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT}`);
  console.log(`-----------------------------------------`);
});
