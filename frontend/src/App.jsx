import React, { useState, useEffect, useRef } from 'react';

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

  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(setArtists);
  }, []);

  // --- DYNAMIC BACKGROUND STYLE ---
  // This creates a glowing aura based on the selected artist's image
  const dynamicBg = (view === 'game' || view === 'results') && selectedArtistImg 
    ? {
        backgroundImage: `radial-gradient(circle at 50% 30%, rgba(229, 9, 20, 0.15), transparent), url(${selectedArtistImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'blur(80px) brightness(0.4)',
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: -1,
        transform: 'scale(1.2)'
      }
    : { background: '#000', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    fetch(`${API_URL}/api/search/${searchTerm}`).then(res => res.json()).then(setArtists);
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
    } catch (err) { alert("Error starting game!"); }
    finally { setLoading(false); }
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

  return (
    <div style={styles.appWrapper}>
      {/* The Dynamic Background Layer */}
      <div style={dynamicBg} />

      <div style={styles.contentLayer}>
        <h1 style={styles.mainTitle} onClick={() => window.location.reload()}>VECTFLIX</h1>

        {view === 'home' && (
          <div style={styles.glassCard}>
            <form onSubmit={handleSearch} style={styles.searchBox}>
              <input style={styles.searchBar} placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <button type="submit" style={styles.goBtn}>GO</button>
            </form>
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

        {view === 'game' && allRounds[roundIndex] && (
          <GameRound key={roundIndex} roundData={allRounds[roundIndex]} roundNum={roundIndex + 1} onAnswer={handleAnswer} />
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
  appWrapper: { minHeight: '100vh', position: 'relative', overflowX: 'hidden' },
  contentLayer: { position: 'relative', zIndex: 1, padding: '20px', textAlign: 'center' },
  mainTitle: { color: '#E50914', letterSpacing: '8px', cursor: 'pointer', fontWeight: '900', fontSize: '2rem', marginBottom: '30px' },
  glassCard: { background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', borderRadius: '24px', padding: '30px', maxWidth: '500px', margin: '0 auto', border: '1px solid rgba(255,255,255,0.1)' },
  searchBox: { display: 'flex', gap: '10px', marginBottom: '20px' },
  searchBar: { flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff' },
  goBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  artistCard: { cursor: 'pointer', transition: 'transform 0.2s' },
  artistImg: { width: '100%', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' },
  timerBar: { width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', margin: '20px 0' },
  timerFill: { height: '100%', background: '#E50914', transition: '1s linear' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '15px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer' },
  resultsWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' },
  glassCardResults: { background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.2)', padding: '50px 30px', width: '350px' },
  resultsArtistImg: { width: '130px', height: '130px', borderRadius: '50%', border: '4px solid #E50914', marginBottom: '20px' },
  artistBadge: { background: 'rgba(229, 9, 20, 0.2)', color: '#E50914', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' },
  scoreText: { fontSize: '5rem', fontWeight: '900', margin: '10px 0' },
  timeText: { color: '#aaa', letterSpacing: '2px', marginBottom: '30px' },
  playBtn: { width: '100%', padding: '16px', background: '#E50914', border: 'none', color: '#fff', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }
};
