import React, { useState, useEffect, useRef } from 'react';

const API_URL = "https://music-guessing-api-v2.onrender.com"; 

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

  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(setArtists);
  }, []);

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
    } catch (err) { alert("Server is waking up... try again in 10 seconds"); }
    finally { setLoading(false); }
  };

  const handleAnswer = (wasCorrect) => {
    const newScore = wasCorrect ? score + 1 : score;
    if (wasCorrect) setScore(newScore);
    if (roundIndex < allRounds.length - 1) {
      setTimeout(() => setRoundIndex(prev => prev + 1), 200);
    } else {
      setTotalTime(Math.floor((Date.now() - startTime) / 1000));
      setView('results');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle} onClick={() => window.location.reload()}>VECTFLIX</h1>

      {view === 'home' && (
        <>
          <form onSubmit={handleSearch} style={styles.searchBox}>
            <input style={styles.searchBar} placeholder="Search artist..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <button type="submit" style={styles.goBtn}>GO</button>
          </form>
          {loading && <p style={{color: '#E50914'}}>Preparing Game...</p>}
          <div style={styles.artistGrid}>
            {artists.map(a => (
              <div key={a.id} style={styles.artistCard} onClick={() => startFullGame(a.id, a.name, a.picture_medium)}>
                <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                <p style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{a.name}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'game' && allRounds[roundIndex] && (
        <GameRound key={roundIndex} roundData={allRounds[roundIndex]} roundNum={roundIndex + 1} onAnswer={handleAnswer} />
      )}

      {view === 'results' && (
        <div style={styles.resultsContainer}>
            <div style={styles.glassCard}>
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
      <div style={styles.gameWrapper}>
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
  container: { background: '#141414', color: 'white', minHeight: '100vh', padding: '20px', textAlign: 'center', fontFamily: 'Arial' },
  mainTitle: { color: '#E50914', letterSpacing: '6px', cursor: 'pointer', fontWeight: '900', fontSize: '2rem', marginBottom: '30px' },
  searchBox: { display: 'flex', gap: '10px', maxWidth: '400px', margin: '0 auto 30px' },
  searchBar: { flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid #333', background: '#000', color: 'white' },
  goBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '20px' },
  artistCard: { cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '8px', marginBottom: '8px' },
  gameWrapper: { maxWidth: '400px', margin: '40px auto', background: '#1f1f1f', padding: '30px', borderRadius: '15px' },
  timerBar: { width: '100%', height: '6px', background: '#333', margin: '20px 0', borderRadius: '10px' },
  timerFill: { height: '100%', background: '#E50914', borderRadius: '10px', transition: '1s linear' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  choiceBtn: { padding: '16px', background: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer' },
  resultsContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', background: 'radial-gradient(circle at 20% 20%, rgba(229, 9, 20, 0.4) 0%, rgba(20, 20, 20, 1) 70%)', borderRadius: '20px' },
  glassCard: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '28px', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '40px', width: '100%', maxWidth: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  resultsArtistImg: { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #E50914', marginBottom: '20px', boxShadow: '0 0 30px rgba(229, 9, 20, 0.6)' },
  artistBadge: { background: 'rgba(229, 9, 20, 0.2)', color: '#E50914', padding: '6px 16px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', border: '1px solid #E50914' },
  scoreText: { fontSize: '4.5rem', fontWeight: '900', color: '#fff', margin: '15px 0' },
  timeText: { fontSize: '1rem', color: '#aaa', letterSpacing: '2px', marginBottom: '30px' },
  playBtn: { width: '100%', padding: '16px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }
};
