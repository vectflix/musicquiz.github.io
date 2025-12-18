import React, { useState, useEffect, useRef } from 'react';

// Use the environment variable for the backend URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function App() {
  const [view, setView] = useState('home'); 
  const [artists, setArtists] = useState([]);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/artists`)
      .then(res => res.json())
      .then(data => setArtists(data.slice(0, 10)))
      .catch(err => console.error("Backend not reachable:", err));
  }, []);

  const startGame = async (artistId) => {
    const res = await fetch(`${API_URL}/api/game/start/${artistId}`);
    const data = await res.json();
    setGameData(data);
    setView('game');
  };

  return (
    <div style={{ textAlign: 'center', color: 'white', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>🎶 Music Guesser</h1>
      {view === 'home' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {artists.map(a => (
            <div key={a.id} onClick={() => startGame(a.id)} style={{ cursor: 'pointer', background: '#222', padding: '10px', borderRadius: '10px' }}>
              <img src={a.picture_medium} style={{ borderRadius: '50%', width: '80px' }} />
              <p>{a.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <Game song={gameData} onBack={() => setView('home')} />
      )}
    </div>
  );
}

function Game({ song, onBack }) {
  const [attempt, setAttempt] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const audioRef = useRef(new Audio(song.preview));
  const times = [1, 3, 7, 15, 30];

  const play = () => {
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setTimeout(() => audioRef.current.pause(), times[attempt] * 1000);
  };

  return (
    <div>
      <button onClick={play} style={{ fontSize: '2rem', padding: '20px', borderRadius: '50%', background: '#1DB954', border: 'none', color: 'white' }}>▶</button>
      <p>Attempt: {attempt + 1} ({times[attempt]}s)</p>
      {!gameOver ? (
        <div>
          <button onClick={() => setGameOver(true)} style={{ margin: '10px', padding: '10px' }}>I Know It!</button>
          <button onClick={() => attempt < 4 ? setAttempt(attempt + 1) : setGameOver(true)} style={{ margin: '10px', padding: '10px' }}>Skip</button>
        </div>
      ) : (
        <div>
          <img src={song.cover} style={{ width: '200px' }} />
          <h3>{song.title}</h3>
          <p>{song.artist}</p>
          <button onClick={onBack}>Play Again</button>
        </div>
      )}
    </div>
  );
}
