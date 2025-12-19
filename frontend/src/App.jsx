import React, { useState, useEffect, useRef } from 'react';

// IMPORTANT: Replace this with your NEW Render URL once you create the service
const API_URL = "https://your-new-backend-name.onrender.com"; 

export default function App() {
  const [view, setView] = useState('home'); 
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedArtistImg, setSelectedArtistImg] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Fetch Deezer Trending Artists on load
  useEffect(() => {
    fetch(`${API_URL}/api/artists`)
      .then(res => res.json())
      .then(data => setArtists(data))
      .catch(err => console.log("Backend waking up..."));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    fetch(`${API_URL}/api/search/${searchTerm}`)
      .then(res => res.json())
      .then(setArtists);
  };

  const startFullGame = async (artistId, artistName, artistImg) => {
    setLoading(true);
    setSelectedArtist(artistName);
    setSelectedArtistImg(artistImg);
    try {
      const res = await fetch(`${API_URL}/api/game/setup/${artistId}`);
      const data = await res.json();
      setAllRounds(data);
      setScore(0);
      setRoundIndex(0);
      setStartTime(Date.now());
      setView('game');
    } catch (err) { 
      alert("Error: Make sure your Render backend is live!"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAnswer = (wasCorrect) => {
    if (wasCorrect) setScore(s => s + 1);
    if (roundIndex < allRounds.length - 1) {
      setTimeout(() => setRoundIndex(prev => prev + 1), 300);
    } else {
      setTotalTime(Math.floor((Date.now() - startTime) / 1000));
      setView('results');
    }
  };

  // UI rendering logic goes here next...
  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle} onClick={() => window.location.reload()}>VECTFLIX</h1>
      {/* Rest of the UI will be in the next block */}
      {view === 'home' && renderHome()}
      {view === 'game' && renderGame()}
      {view === 'results' && renderResults()}
    </div>
  );

  // Helper render functions and Styles to follow in next step
}
