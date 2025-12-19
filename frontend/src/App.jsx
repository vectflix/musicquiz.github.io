import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION ---
// Replace this with your NEW Render URL once the service is live
const API_URL = "https://your-new-service-name.onrender.com"; 

export default function App() {
  // View Management
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data State
  const [artists, setArtists] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  
  // Game Tracking
  const [score, setScore] = useState(0);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedArtistImg, setSelectedArtistImg] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Load Trending Artists from Deezer on Start
  useEffect(() => {
    fetch(`${API_URL}/api/artists`)
      .then(res => res.json())
      .then(data => setArtists(data))
      .catch(err => console.log("Waiting for backend..."));
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
      if (data.length === 0) throw new Error("No tracks found");
      
      setAllRounds(data);
      setScore(0);
      setRoundIndex(0);
      setStartTime(Date.now());
      setView('game');
    } catch (err) { 
      alert("Error starting game. Is the backend live?"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleAnswer = (wasCorrect) => {
    if (wasCorrect) setScore(s => s + 1);
    
    // Move to next round or finish
    if (roundIndex < allRounds.length - 1) {
      setTimeout(() => setRoundIndex(prev => prev + 1), 300);
    } else {
      setTotalTime(Math.floor((Date.now() - startTime) / 1000));
      setView('results');
    }
  };

  // --- RENDER LOGIC ---
  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle} onClick={() => window.location.reload()}>VECTFLIX</h1>

      {/* HOME VIEW */}
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
          {loading && <p style={{color: '#E50914'}}>Loading Game...</p>}
          <div style={styles.artistGrid}>
            {artists.map(a => (
              <div key={a.id} style={styles.artistCard} onClick={() => startFullGame(a.id, a.name, a.picture_medium)}>
                <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                <p style={{fontSize: '0.7rem', fontWeight: 'bold'}}>{a.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GAME VIEW */}
      {view === 'game' && allRounds[roundIndex] && (
        <GameRound 
          key={roundIndex} 
          roundData={allRounds[roundIndex]} 
          roundNum={roundIndex + 1} 
          onAnswer={handleAnswer} 
        />
      )}

      {/* RESULTS VIEW (GLASSMORPHISM) */}
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
  );
}

// --- SUB-COMPONENT: Game Round Logic ---
function GameRound({ roundData, roundNum, onAnswer }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(roundData.preview);
    audioRef.current = audio;
    audio.play().catch(() => {});
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { 
          onAnswer(false); 
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []); 

  return (
    <div style={styles.glassCard}>
      <p style={{color: '#E50914', fontWeight: 'bold', letterSpacing: '2px'}}>ROUND {roundNum}</p>
      <div style={styles.timerBar}>
        <div style={{...styles.timerFill, width: `${timeLeft*10}%`}}></div>
      </div>
      <div style={styles.choicesGrid}>
        {roundData.choices.map(c => (
          <button key={c.id} style={styles.choiceBtn} onClick={() => onAnswer(c.id === roundData.correctId)}>
            {c.title}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: { background: '#000', color: 'white', minHeight: '100vh', padding: '20px', textAlign: 'center', fontFamily: 'Arial' },
  mainTitle: { color: '#E50914', letterSpacing: '8px', cursor: 'pointer', fontWeight: '900', fontSize: '2rem', marginBottom: '30px' },
  
  // Home/Game Layout
  glassCard: { background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: '20px', padding: '30px', maxWidth: '500px', margin: '0 auto', border: '1px solid rgba(255,255,255,0.1)' },
  searchBox: { display: 'flex', gap: '10px', marginBottom: '20px' },
  searchBar: { flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#222', color: '#fff' },
  goBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  artistCard: { cursor: 'pointer', transition: '0.2s' },
  artistImg: { width: '100%', borderRadius: '50%', border: '2px solid #333' },
  
  // Game Elements
  timerBar: { width: '100%', height: '4px', background: '#333', margin: '20px 0', borderRadius: '2px' },
  timerFill: { height: '100%', background: '#E50914', transition: '1s linear', borderRadius: '2px' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '15px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem' },
  
  // Results Glassmorphism
  resultsWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', background: 'radial-gradient(circle at top left, rgba(229, 9, 20, 0.3), transparent)' },
  glassCardResults: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', padding: '50px 30px', width: '350px', textAlign: 'center', boxShadow: '0 8px 32px 0 rgba(0,0,0,0.8)' },
  resultsArtistImg: { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #E50914', marginBottom: '20px', boxShadow: '0 0 20px rgba(229, 9, 20, 0.5)' },
  artistBadge: { background: 'rgba(229, 9, 20, 0.2)', color: '#E50914', padding: '5px 15px', borderRadius: '20px', display: 'inline-block', fontWeight: 'bold', fontSize: '0.8rem', border: '1px solid rgba(229, 9, 20, 0.5)' },
  scoreText: { fontSize: '4.5rem', fontWeight: '900', margin: '10px 0', color: '#fff' },
  timeText: { color: '#888', letterSpacing: '2px', marginBottom: '30px', fontSize: '0.9rem' },
  playBtn: { width: '100%', padding: '15px', background: '#E50914', border: 'none', color: '#fff', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }
};
