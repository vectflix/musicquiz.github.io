import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const API_URL = "https://music-guessing-api-v3.onrender.com"; 

export default function App() {
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(localStorage.getItem('vectflix_highscore') || 0);
  const [newBest, setNewBest] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedArtistImg, setSelectedArtistImg] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(data => {
      if(Array.isArray(data)) setArtists(data);
    }).catch(() => console.log("Backend waking up..."));
  }, []);

  // --- SOUND EFFECTS ---
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      }
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
  };

  // --- SHARE FUNCTION ---
  const shareResult = () => {
    const text = `🔥 I just scored ${score}/10 on VECTFLIX guessing ${selectedArtist} songs! Can you beat me? \n\nPlay here: ${window.location.origin}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const startFullGame = async (artistId, artistName, artistImg) => {
    setLoading(true);
    setSelectedArtist(artistName);
    setSelectedArtistImg(artistImg);
    setNewBest(false);
    try {
      const res = await fetch(`${API_URL}/api/game/setup/${artistId}`);
      const data = await res.json();
      setAllRounds(data);
      setScore(0); setRoundIndex(0); setStartTime(Date.now()); setView('game');
    } catch (err) { alert("Backend is waking up! Try again in 10s."); }
    finally { setLoading(false); }
  };

  const handleAnswer = (wasCorrect) => {
    playSound(wasCorrect ? 'correct' : 'wrong');
    if (wasCorrect) setScore(s => s + 1);
    
    if (roundIndex < allRounds.length - 1) {
      setTimeout(() => setRoundIndex(prev => prev + 1), 400);
    } else {
      const finalScore = wasCorrect ? score + 1 : score;
      setTotalTime(Math.floor((Date.now() - startTime) / 1000));
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('vectflix_highscore', finalScore);
        setNewBest(true);
      }
      setView('results');
    }
  };

  const dynamicBgStyle = (view !== 'home' && selectedArtistImg) ? {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), url(${selectedArtistImg})`,
    backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(60px)',
    position: 'fixed', top: '-10%', left: '-10%', width: '120%', height: '120%', zIndex: -1
  } : { background: '#000', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 };

  return (
    <div style={{ minHeight: '100vh', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      <div style={dynamicBgStyle} />
      
      <div style={{ position: 'relative', zIndex: 1, padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        <header style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={styles.mainTitle} onClick={() => window.location.reload()}>VECTFLIX</h1>
          <div style={styles.highScoreBadge}>PERSONAL BEST: {highScore}/10</div>
        </header>

        {view === 'home' && (
          <div style={styles.glassCard}>
            <form onSubmit={(e) => { e.preventDefault(); fetch(`${API_URL}/api/search/${searchTerm}`).then(res => res.json()).then(setArtists); }} style={styles.searchBox}>
              <input style={styles.searchBar} placeholder="Search Artist..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <button type="submit" style={styles.goBtn}>GO</button>
            </form>
            {loading && <p style={{color: '#E50914', marginBottom: '10px'}}>Loading music tracks...</p>}
            <div style={styles.artistGrid}>
              {artists.map(a => (
                <div key={a.id} style={styles.artistCard} onClick={() => startFullGame(a.id, a.name, a.picture_medium)}>
                  <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                  <p style={{fontSize: '0.7rem', marginTop: '5px', fontWeight: 'bold'}}>{a.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'game' && allRounds[roundIndex] && (
          <GameRound key={roundIndex} roundData={allRounds[roundIndex]} roundNum={roundIndex + 1} onAnswer={handleAnswer} />
        )}

        {view === 'results' && (
          <div style={styles.glassCardResults}>
            {newBest && <div style={styles.newBestTag}>NEW BEST!</div>}
            <img src={selectedArtistImg} style={styles.resultsArtistImg} />
            <h2 style={{margin: '5px 0'}}>{selectedArtist}</h2>
            <div style={styles.scoreCircle}>
              <span style={{fontSize: '4rem', fontWeight: '900'}}>{score}</span>
              <span style={{fontSize: '1.2rem', opacity: 0.5}}>/10</span>
            </div>
            <p style={{color: '#aaa', fontSize: '0.9rem'}}>Time: {totalTime} seconds</p>
            
            <div style={styles.bioBox}>
              <p style={{fontSize: '0.8rem', lineHeight: '1.5', opacity: 0.9}}>
                You've mastered the sounds of {selectedArtist}! {score >= 8 ? "You're a true superfan." : "Keep listening to level up your score."}
              </p>
            </div>

            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
               <button style={styles.shareBtn} onClick={shareResult}>
                {copied ? "COPIED!" : "SHARE SCORE"}
               </button>
               <button style={styles.playBtn} onClick={() => window.location.reload()}>RETRY</button>
            </div>
          </div>
        )}

        <footer style={styles.footer}>
          <a href="https://www.instagram.com/vecteezy_1" target="_blank" rel="noreferrer" style={styles.instaLink}>
            Design by @vecteezy_1
          </a>
        </footer>
      </div>
    </div>
  );
}

function GameRound({ roundData, roundNum, onAnswer }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(roundData.preview);
    audioRef.current = audio; audio.play().catch(() => {});
    const timer = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { onAnswer(false); return 0; } return prev - 1; });
    }, 1000);
    return () => { clearInterval(timer); if (audioRef.current) audioRef.current.pause(); };
  }, []); 

  return (
    <div style={styles.glassCard}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold'}}>
        <span style={{color: '#E50914'}}>ROUND {roundNum}</span>
        <span>0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
      </div>
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
  mainTitle: { color: '#E50914', letterSpacing: '6px', cursor: 'pointer', fontWeight: '900', fontSize: '2.2rem' },
  highScoreBadge: { fontSize: '0.7rem', color: '#666', letterSpacing: '2px', marginTop: '-10px' },
  glassCard: { background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(15px)', borderRadius: '24px', padding: '25px', border: '1px solid rgba(255,255,255,0.1)' },
  searchBox: { display: 'flex', gap: '8px', marginBottom: '20px' },
  searchBar: { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff' },
  goBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '12px', fontWeight: 'bold' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' },
  artistCard: { cursor: 'pointer', textAlign: 'center' },
  artistImg: { width: '100%', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' },
  timerBar: { width: '100%', height: '5px', background: '#222', margin: '15px 0', borderRadius: '10px', overflow: 'hidden' },
  timerFill: { height: '100%', background: '#E50914', transition: '1s linear' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '15px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' },
  glassCardResults: { background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(20px)', borderRadius: '30px', padding: '30px 20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' },
  newBestTag: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#FFD700', color: '#000', padding: '4px 12px', borderRadius: '20px', fontWeight: '900', fontSize: '0.7rem' },
  resultsArtistImg: { width: '90px', height: '90px', borderRadius: '50%', border: '3px solid #E50914', marginBottom: '10px' },
  scoreCircle: { margin: '10px 0' },
  bioBox: { background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '15px', margin: '15px 0' },
  playBtn: { flex: 1, padding: '15px', background: '#E50914', border: 'none', color: '#fff', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  shareBtn: { flex: 1, padding: '15px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  footer: { marginTop: '30px', textAlign: 'center' },
  instaLink: { color: '#555', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 'bold' }
};
