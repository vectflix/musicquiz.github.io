const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Get Initial Trending Artists
app.get('/api/artists', async (req, res) => {
  try {
    const response = await axios.get('https://api.deezer.com/chart/0/artists');
    res.json(response.data.data);
  } catch (error) { res.status(500).send("Error fetching artists"); }
});

// 2. Search Artists Globally
app.get('/api/search/:name', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/search/artist?q=${req.params.name}`);
    res.json(response.data.data);
  } catch (error) { res.status(500).send("Search failed"); }
});

// 3. Setup 10 Unique Rounds
app.get('/api/game/setup/:artistId', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/artist/${req.params.artistId}/top?limit=50`);
    const allTracks = response.data.data;
    
    // Shuffle all tracks to ensure randomness
    const shuffledTracks = allTracks.sort(() => 0.5 - Math.random());
    
    const gameRounds = [];
    // Create 10 rounds using different songs
    for(let i=0; i < 10; i++) {
        const correctTrack = shuffledTracks[i];
        // Pick 3 wrong choices from the remaining songs
        const others = shuffledTracks.filter(t => t.id !== correctTrack.id).sort(() => 0.5 - Math.random()).slice(0, 3);
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
  } catch (error) { res.status(500).send("Error setting up game"); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend Live on Port ${PORT}`));
