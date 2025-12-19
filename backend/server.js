const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB Connected"))
  .catch(err => console.error("DB Error:", err));

// MODELS
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
}));

const Score = mongoose.model('Score', new mongoose.Schema({
  username: String,
  score: Number,
  time: Number,
  artist: String,
  date: { type: Date, default: Date.now }
}));

// AUTH ROUTES
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({ username: req.body.username, password: hashedPassword });
    await user.save();
    res.json({ message: "User created" });
  } catch (e) { res.status(400).json({ error: "Username taken" }); }
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    res.json({ username: user.username });
  } else { res.status(401).json({ error: "Invalid credentials" }); }
});

// SCORE ROUTES
app.post('/api/scores', async (req, res) => {
  await new Score(req.body).save();
  res.json({ message: "Score saved" });
});

app.get('/api/leaderboard', async (req, res) => {
  const scores = await Score.find().sort({ score: -1, time: 1 }).limit(10);
  res.json(scores);
});

// ARTIST SEARCH
app.get('/api/search/:query', async (req, res) => {
    try {
        const response = await axios.get(`https://api.deezer.com/search/artist?q=${req.params.query}`);
        res.json(response.data.data);
    } catch (e) { res.json([]); }
});

app.get('/api/artists', async (req, res) => {
  try {
      const response = await axios.get('https://api.deezer.com/chart/0/artists');
      res.json(response.data.data);
  } catch (e) { res.json([]); }
});

// GAME SETUP (FIXED: Filters out broken songs)
app.get('/api/game/setup/:artistId', async (req, res) => {
  try {
    const response = await axios.get(`https://api.deezer.com/artist/${req.params.artistId}/top?limit=50`);
    
    // FILTER: Only keep songs that actually have a preview URL
    const validTracks = response.data.data.filter(t => t.preview && t.title);
    
    // Shuffle
    const shuffled = validTracks.sort(() => 0.5 - Math.random());
    
    // Create Rounds
    const rounds = shuffled.slice(0, 10).map(track => {
      const choices = [track, ...validTracks.filter(t => t.id !== track.id).slice(0, 3)]
        .sort(() => 0.5 - Math.random());
      
      return {
        correctId: track.id,
        preview: track.preview,
        title: track.title,
        choices: choices.map(c => ({ id: c.id, title: c.title }))
      };
    });
    res.json(rounds);
  } catch (e) {
    res.status(500).json({ error: "Could not fetch songs" });
  }
});

app.listen(process.env.PORT || 3001);
