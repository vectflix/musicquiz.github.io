import React, { useState, useEffect, useRef } from 'react';

// Replace this with your actual Render URL
const API_URL = "https://your-new-service-name.onrender.com"; 

export default function App() {
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedArtistImg, setSelectedArtistImg] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Initial Fetch
  useEffect(() => {
    fetch(`${API_URL}/api/artists`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setArtists(data);
      })
      .catch(err => console.error("Backend waking up..."));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    fetch(`${API_URL}/api/search/${searchTerm}`)
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data)) setArtists(data);
      });
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
      alert("Error: Backend is likely sleeping. Wait 30s and try again."); 
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

  // This ensures the background color is ALWAYS dark even if the image hasn't loaded
  const dynamicBgStyle = (view !== 'home' && selectedArtistImg) ? {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${selectedArtistImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(50px)',
    position: 'fixed',
    top: '-10%', left: '-10%', width: '120%', height: '120%',
    zIndex: -1
  } : {
    background: '#000',
    position: 'fixed',
    top: 0, left: 0, width: '100%', height: '100%',
    zIndex: -1
  };

  return (
    <div style={{ minHeight: '100vh', color: 'white', fontFamily: 'Arial' }}>
      <div style={dynamicBgStyle} />
      
      <div style={{ position: 'relative', zIndex: 1, padding: '20px' }}>
        <h1 style={styles.mainTitle} onClick={() => window.location.reload()}>VECTFLIX</h1>

        {view === 'home' && (
          <div style={styles.glassCard}>
            <form onSubmit={handleSearch} style={styles.searchBox}>
              <input 
                style={styles.searchBar} 
                placeholder="Search Artist..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
              <button type="submit" style={styles.goBtn}>GO</button>
            </form>
            <div style={styles.artistGrid}>
              {artists.length > 0 ? artists.map(a => (
                <div key={a.id} style={styles.artistCard} onClick={() => startFullGame(a.id, a.name, a.picture_medium)}>
                  <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                  <p style={{fontSize: '0.7rem', fontWeight: 'bold'}}>{a.name}</p>
                </div>
              )) : <p>Loading Artists...</p>}
            </div>
          </div>
        )}

        {view === 'game' && allRounds[roundIndex] && (
          <GameRound 
            key={roundIndex} 
            roundData={allRounds[roundIndex]} 
            roundNum={roundIndex + 1} 
            onAnswer={handleAnswer} 
          />
        )}

        {view === 'results' && (
          <div style={styles.resultsWrapper}>
            <div style={styles.glassCardResults}>
              <img src={selectedArtistImg} style={styles.resultsArtistImg} alt="Artist" />
              <div style={styles.artistBadge}>{selectedArtist}</div>
              <h2 style={styles.scoreText}>{Math.round((score/allRounds.length)*100)}%</h2>
              <p style={styles.timeText}>TIME: {totalTime}s</p>
              <button style={styles.playBtn} onClick={() => window.location.reload()}>PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GameRound({ roundData, roundNum, onAnswer }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(roundData.preview);
    audioRef.current = audio;
    audio.play().catch(() => {});
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { onAnswer(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { clearInterval(timer); if (audioRef.current) audioRef.current.pause(); };
  }, []); 

  return (
    <div style={styles.glassCard}>
      <p style={{color: '#E50914', fontWeight: 'bold'}}>ROUND {roundNum}</p>
      <div style={styles.timerBar}><div style={{...styles.timerFill, width: `${timeLeft*10}%`}}></div></div>
      <div style={styles.choicesGrid}>
        {roundData.choices.map(c => (
          <button key={c.id} style={styles.choiceBtn} onClick={() => onAnswer(c.id === roundData.correctId)}>{c.title}</button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  mainTitle: { color: '#E50914', textAlign: 'center', letterSpacing: '8px', cursor: 'pointer', fontWeight: '900', fontSize: '2rem', marginBottom: '30px' },
  glassCard: { background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: '20px', padding: '30px', maxWidth: '500px', margin: '0 auto', border: '1px solid rgba(255,255,255,0.1)' },
  searchBox: { display: 'flex', gap: '10px', marginBottom: '20px' },
  searchBar: { flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#222', color: '#fff' },
  goBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  artistCard: { cursor: 'pointer', textAlign: 'center' },
  artistImg: { width: '100%', borderRadius: '50%', border: '2px solid #333' },
  timerBar: { width: '100%', height: '4px', background: '#333', margin: '20px 0' },
  timerFill: { height: '100%', background: '#E50914', transition: '1s linear' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '15px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', cursor: 'pointer' },
  resultsWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' },
  glassCardResults: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', padding: '50px 30px', width: '350px', textAlign: 'center' },
  resultsArtistImg: { width: '120px', height: '120px', borderRadius: '50%', border: '3px solid #E50914', marginBottom: '20px' },
  artistBadge: { background: 'rgba(229, 9, 20, 0.2)', color: '#E50914', padding: '5px 15px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold' },
  scoreText: { fontSize: '4.5rem', fontWeight: '900', margin: '10px 0' },
  timeText: { color: '#888', letterSpacing: '2px', marginBottom: '30px' },
  playBtn: { width: '100%', padding: '15px', background: '#E50914', border: 'none', color: '#fff', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }
};
