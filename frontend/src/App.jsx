import React, { useState, useEffect, useRef } from 'react';

// Automatically connects to your Render backend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function App() {
  const [view, setView] = useState('home'); 
  const [artists, setArtists] = useState([]);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/artists`)
      .then(res => res.json())
      .then(data => setArtists(data.slice(0, 10)))
      .catch(err => console.error("Server is waking up or unreachable...", err));
  }, []);

  const startGame = async (artistId) => {
    const res = await fetch(`${API_URL}/api/game/start/${artistId}`);
    const data = await res.json();
    setGameData(data);
    setView('game');
  };

  return (
    <div style={{ 
      textAlign: 'center', 
      color: 'white', 
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', 
      minHeight: '100vh', 
      padding: '40px 20px',
      background: '#141414',
      backgroundImage: 'radial-gradient(circle at top, rgba(45, 45, 45, 1) 0%, rgba(20, 20, 20, 1) 70%)',
      backgroundAttachment: 'fixed'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', fontWeight: 'bold' }}>🎶 Music Guesser</h1>
      
      {view === 'home' ? (
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#aaa', marginBottom: '20px' }}>Select an Artist to Start</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '20px', 
            maxWidth: '1000px', 
            margin: '0 auto' 
          }}>
            {artists.map(a => (
              <div 
                key={a.id} 
                onClick={() => startGame(a.id)} 
                style={{ 
                  cursor: 'pointer', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  padding: '20px', 
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <img src={a.picture_medium} style={{ borderRadius: '8px', width: '100%', boxShadow: '0 8px 15px rgba(0,0,0,0.5)' }} />
                <p style={{ marginTop: '15px', fontWeight: '600' }}>{a.name}</p>
              </div>
            ))}
          </div>
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
    <div style={{ maxWidth: '400px', margin: '0 auto', background: 'rgba(255,255,255,0.05)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
      {!gameOver ? (
        <div>
          <button onClick={play} style={{ 
            fontSize: '3rem', padding: '30px', borderRadius: '50%', background: '#E50914', border: 'none', color: 'white', cursor: 'pointer', marginBottom: '20px', transition: '0.2s' 
          }} onMouseOver={(e) => e.target.style.scale = '1.1'} onMouseOut={(e) => e.target.style.scale = '1'}>
            ▶
          </button>
          <p style={{ color: '#ccc' }}>Attempt {attempt + 1} of 5</p>
          <p style={{ fontWeight: 'bold' }}>Listening for: {times[attempt]}s</p>
          <div style={{ marginTop: '30px' }}>
            <button onClick={() => setGameOver(true)} style={{ background: 'white', color: 'black', padding: '12px 24px', borderRadius: '4px', border: 'none', fontWeight: 'bold', margin: '5px', cursor: 'pointer' }}>Guess Artist</button>
            <button onClick={() => attempt < 4 ? setAttempt(attempt + 1) : setGameOver(true)} style={{ background: 'transparent', color: 'white', padding: '12px 24px', borderRadius: '4px', border: '1px solid white', margin: '5px', cursor: 'pointer' }}>Skip +{times[attempt+1]-times[attempt]}s</button>
          </div>
        </div>
      ) : (
        <div>
          <img src={song.cover} style={{ width: '100%', borderRadius: '8px', marginBottom: '20px' }} />
          <h2 style={{ margin: '5px 0' }}>{song.title}</h2>
          <p style={{ color: '#E50914', fontWeight: 'bold', marginBottom: '20px' }}>{song.artist}</p>
          <button onClick={onBack} style={{ background: 'white', color: 'black', padding: '12px 24px', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Play Next Song</button>
        </div>
      )}
    </div>
  );
}
