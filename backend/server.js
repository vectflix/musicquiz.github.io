const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Enable CORS so your frontend can talk to this server
app.use(cors());
app.use(express.json());

const DEEZER_API = "https://api.deezer.com";

// 1. Get Top Artists for the Home Screen
app.get('/api/artists', async (req, res) => {
  try {
    const response = await axios.get(`${DEEZER_API}/chart/0/artists`);
    res.json(response.data.data);
  } catch (error) {
    console.error("Error fetching artists:", error.message);
    res.status(500).json({ error: "Failed to fetch artists" });
  }
});

// 2. Get a Random Song for a specific Artist
app.get('/api/game/start/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;
    // We fetch the top 50 songs to make sure the game is different every time
    const response = await axios.get(`${DEEZER_API}/artist/${artistId}/top?limit=50`);
    const tracks = response.data.data;

    if (!tracks || tracks.length === 0) {
      return res.status(404).json({ error: "No tracks found" });
    }

    // Pick one random track from the 50
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

    res.json({
      id: randomTrack.id,
      preview: randomTrack.preview, // The 30-second audio clip
      title: randomTrack.title,
      artist: randomTrack.artist.name,
      cover: randomTrack.album.cover_xl
    });
  } catch (error) {
    console.error("Error fetching song:", error.message);
    res.status(500).json({ error: "Failed to fetch song" });
  }
});

// 3. Search functionality for the guessing box
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  try {
    const response = await axios.get(`${DEEZER_API}/search?q=${q}`);
    const results = response.data.data.slice(0, 5).map(track => ({
      title: track.title,
      artist: track.artist.name
    }));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

// Health check to verify the server is awake
app.get('/', (req, res) => {
  res.send("Server is running!");
});

// Render will provide a PORT, otherwise use 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
