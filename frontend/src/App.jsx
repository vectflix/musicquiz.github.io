import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- CONFIGURATION ---
const API_URL = "https://music-guessing-api-v3.onrender.com"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a high-speed music guessing game designed for music lovers. Using the Deezer API, we provide 30-second song previews to test your knowledge of your favorite artists. Created by @vecteezy_1, this platform aims to celebrate musical culture through interactive play.",
  privacy: "Privacy Policy: VECTFLIX does not store personal user data. We use local storage only to save your high scores. Third-party partners, such as Google AdSense, may use cookies to serve ads based on your prior visits to this website. You can opt out of personalized advertising in your browser settings."
};

// Ad Component
const AdSlot = () => {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, []);
  return (
    <div style={styles.adSlot}>
      <p style={{fontSize: '0.6rem', color: '#444', marginBottom: '8px'}}>ADVERTISEMENT</p>
      <div style={styles.adPlaceholder}>
        <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-YOUR_ID" data-ad-slot="YOUR_SLOT" data-ad-format="auto" data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(localStorage.getItem('vectflix_highscore') || 0);
  const [selectedArtistImg, setSelectedArtistImg] = useState('');
  const [startTime, setStartTime] = useState(null);

  // --- ⚡ SPEED ENGINE: MULTI-ROUND PRE-FETCH ---
  useEffect(() => {
    if (view === 'game') {
      // Pre-load current, next, and next-next to eliminate buffering gap
      [roundIndex + 1, roundIndex + 2].forEach(idx => {
        if (allRounds[idx]) {
          const img = new Image(); img.src = allRounds[idx].preview; // Logic to trigger browser cache
          const audio = new Audio(); audio.src = allRounds[idx].preview;
          audio.preload = "auto";
        }
      });
    }
  }, [roundIndex, view, allRounds]);

  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(data => {
      if(Array.isArray(data)) setArtists(data);
    }).catch(() => console.log("Wake up call sent..."));
  }, []);

  const startFullGame = async (artistId, artistName, artistImg) => {
    setLoading(true);
    setSelectedArtistImg(artistImg);
    try {
      const res = await fetch(`${API_URL}/api/game/setup/${artistId}`);
      const data = await res.json();
      setAllRounds(data);
      setScore(0); setRoundIndex(0); setStartTime(Date.now()); setView('game');
    } catch (err) { alert("Server warming up! Try again."); }
    finally { setLoading(false); }
  };

  const handleAnswer = useCallback((wasCorrect) => {
    if (wasCorrect) setScore(s => s + 1);
    if (roundIndex < allRounds.length - 1) {
      setRoundIndex(prev => prev + 1);
    } else {
      if (score + (wasCorrect ? 1 : 0) > highScore) {
        localStorage.setItem('vectflix_highscore', score + (wasCorrect ? 1 : 0));
        setHighScore(score + (wasCorrect ? 1 : 0));
      }
      setView('results');
    }
  }, [roundIndex, allRounds, score, highScore]);

  return (
    <div style={{ minHeight: '100vh', color: 'white', backgroundColor: '#000', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={styles.mainTitle} onClick={() => window.location.reload()}>VECTFLIX</h1>
          <div style={styles.highScoreBadge}>BEST: {highScore}/10</div>
        </header>

        {view === 'home' && (
          <div style={styles.glassCard}>
            <form onSubmit={(e) => { e.preventDefault(); fetch(`${API_URL}/api/search/${searchTerm}`).then(res => res.json()).then(setArtists); }} style={styles.searchBox}>
              <input style={styles.searchBar} placeholder="Search Artist..." onChange={(e) => setSearchTerm(e.target.value)} />
              <button type="submit" style={styles.goBtn}>GO</button>
            </form>
            {loading ? <p style={{textAlign:'center', color:'#E50914'}}>PRE-LOADING CLIPS...</p> : (
              <div style={styles.artistGrid}>
                {artists.map(a => (
                  <div key={a.id} style={styles.artistCard} onClick={() => startFullGame(a.id, a.name, a.picture_medium)}>
                    <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                    <p style={{fontSize: '0.7rem', marginTop: '5px'}}>{a.name}</p>
                  </div>
                ))}
              </div>
            )}
            <AdSlot />
            <div style={styles.legalSection}>
              <h4 style={styles.legalHeading}>About VECTFLIX</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.about}</p>
              <h4 style={styles.legalHeading}>Privacy</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.privacy}</p>
            </div>
          </div>
        )}

        {view === 'game' && allRounds[roundIndex] && (
          <GameRound key={roundIndex} roundData={allRounds[roundIndex]} onAnswer={handleAnswer} />
        )}

        {view === 'results' && (
          <div style={styles.glassCardResults}>
            <h2 style={{fontSize: '3rem', margin: '0'}}>{score}/10</h2>
            <button style={styles.playBtn} onClick={() => window.location.reload()}>PLAY AGAIN</button>
          </div>
        )}

        <footer style={{textAlign:'center', marginTop:'40px'}}>
           <a href="https://instagram.com/vecteezy_1" style={styles.instaLink}>@vecteezy_1</a>
        </footer>
      </div>
    </div>
  );
}

function GameRound({ roundData, onAnswer }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const audioRef = useRef(new Audio(roundData.preview));

  useEffect(() => {
    const audio = audioRef.current;
    audio.play().catch(() => console.log("User must interact first"));
    const timer = setInterval(() => {
      setTimeLeft(t => { if(t <= 1) { onAnswer(false); return 0; } return t - 1; });
    }, 1000);
    return () => { clearInterval(timer); audio.pause(); audio.src = ""; };
  }, [roundData, onAnswer]);

  return (
    <div style={styles.glassCard}>
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
  mainTitle: { color: '#E50914', letterSpacing: '6px', fontWeight: '900', textAlign: 'center', cursor: 'pointer' },
  highScoreBadge: { fontSize: '0.7rem', color: '#666', textAlign: 'center' },
  glassCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' },
  searchBox: { display: 'flex', gap: '10px', marginBottom: '20px' },
  searchBar: { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#222', color: '#fff' },
  goBtn: { background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 20px', fontWeight: 'bold' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' },
  artistCard: { textAlign: 'center', cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '50%' },
  timerBar: { width: '100%', height: '6px', background: '#222', borderRadius: '10px', margin: '10px 0', overflow: 'hidden' },
  timerFill: { height: '100%', background: '#E50914', transition: '1s linear' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '15px', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: '10px', textAlign: 'left', cursor: 'pointer' },
  playBtn: { width: '100%', padding: '15px', background: '#E50914', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '20px' },
  instaLink: { color: '#444', textDecoration: 'none', fontSize: '0.8rem' },
  legalSection: { marginTop: '30px', borderTop: '1px solid #222', paddingTop: '15px' },
  legalHeading: { color: '#E50914', fontSize: '0.8rem', margin: '5px 0' },
  legalBody: { fontSize: '0.6rem', color: '#666', lineHeight: '1.4' },
  adSlot: { margin: '20px 0', textAlign: 'center' },
  adPlaceholder: { minHeight: '100px', background: '#0a0a0a', border: '1px dashed #222', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  glassCardResults: { textAlign: 'center', padding: '40px' }
};
