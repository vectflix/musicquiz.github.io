import React, { useState, useEffect } from 'react';

const API_URL = "https://music-guessing-api-v3.onrender.com"; 
const APPLE_TOKEN = "YOUR_TOKEN_HERE"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium music recognition platform engineered for speed and precision.",
  cookies: "We use essential cookies to maintain your session and optimize performance."
};

const AdSlot = ({ id }) => {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, []);
  return (
    <div style={styles.adSlot}>
      <p style={{fontSize: '0.6rem', color: '#444', marginBottom: '8px'}}>ADVERTISEMENT</p>
      <div style={styles.adPlaceholder}>
        <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-6249624506404198" data-ad-slot={id} data-ad-format="auto" data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [rankings, setRankings] = useState([]);
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  // PEAK: Fetch rankings with Error Handling
  const fetchRankings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/rankings`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRankings(data);
    } catch (e) { console.log("Server still warming up..."); }
  };

  // PEAK: Submit score and wait for response
  const submitScore = async (finalScore) => {
    try {
      await fetch(`${API_URL}/api/rankings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: username, score: finalScore })
      });
      fetchRankings();
    } catch (e) { console.error("Submit failed"); }
  };

  // PEAK: Fixed Search Hook
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        searchArtists(searchTerm);
      }
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchArtists = async (query) => {
    setIsFetching(true);
    try {
      const res = await fetch(`${API_URL}/api/search/artists?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setArtists(Array.isArray(data) ? data : []);
    } catch (e) { setArtists([]); }
    setIsFetching(false);
  };

  const startGame = async (artist) => {
    setIsFetching(true);
    try {
      const res = await fetch(`${API_URL}/api/game/setup/${artist.id}`);
      const data = await res.json();
      setAllRounds(data);
      setScore(0);
      setRoundIndex(0);
      setView('ready');
      setCountdown(5);
    } catch (e) { alert("Artist unavailable. Try another!"); }
    setIsFetching(false);
  };

  useEffect(() => {
    let timer;
    if (view === 'ready' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (view === 'ready' && countdown === 0) {
      // Auto-start when countdown hits 0
    }
    return () => clearTimeout(timer);
  }, [view, countdown]);

  const handleAnswer = (correct) => {
    const finalScore = correct ? score + 1 : score;
    if (correct) setScore(finalScore);
    if (roundIndex < 9) {
      setRoundIndex(roundIndex + 1);
    } else {
      setView('results');
      submitScore(finalScore);
    }
  };

  return (
    <div style={styles.appWrapper}>
      {!isLoggedIn && (
        <div style={styles.loginOverlay}>
          <div style={styles.glassCard}>
            <h2 style={{color: '#E50914'}}>VECTFLIX</h2>
            <input style={styles.loginInput} placeholder="Username" onChange={e => setTempName(e.target.value)} />
            <button style={styles.playBtn} onClick={() => {if(tempName){localStorage.setItem('vectflix_user', tempName); setUsername(tempName); setIsLoggedIn(true);}}}>START</button>
          </div>
        </div>
      )}

      <header style={styles.header} onClick={() => setView('home')}>
        <h1 style={styles.logo}>VECTFLIX</h1>
        <div style={styles.userBadge}>👤 {username}</div>
      </header>

      {view === 'home' && (
        <main>
          <input style={styles.searchInput} placeholder="Search Artist..." onChange={e => setSearchTerm(e.target.value)} />
          {isFetching && <div style={styles.loader}></div>}
          <div style={styles.artistGrid}>
            {artists.map(a => (
              <div key={a.id} style={styles.artistCard} onClick={() => startGame(a)}>
                <img src={a.picture_medium} style={styles.artistImg} alt="" />
                <p style={{fontSize: '0.7rem'}}>{a.name}</p>
              </div>
            ))}
          </div>
        </main>
      )}

      {view === 'ready' && (
        <div style={styles.glassCard}>
          <h1>{countdown}</h1>
          <button style={styles.playBtn} onClick={() => setView('game')}>GO</button>
        </div>
      )}

      {view === 'game' && allRounds[roundIndex] && (
        <div style={styles.gameCard}>
          <audio autoPlay src={allRounds[roundIndex].preview} />
          <div style={styles.choicesGrid}>
            {allRounds[roundIndex].choices.map(c => (
              <button key={c.id} style={styles.choiceBtn} onClick={() => handleAnswer(c.id === allRounds[roundIndex].correctId)}>{c.title}</button>
            ))}
          </div>
        </div>
      )}

      {view === 'results' && (
        <div style={styles.glassCard}>
          <h2>SCORE: {score}/10</h2>
          <button style={styles.playBtn} onClick={() => {fetchRankings(); setView('ranking');}}>RANKINGS</button>
        </div>
      )}

      {view === 'ranking' && (
        <div style={styles.glassCard}>
          <h3>HALL OF FAME</h3>
          <AdSlot id="4888078097" />
          {rankings.map((r, i) => (
            <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #222'}}>
              <span>{r.user}</span><span>{r.score}</span>
            </div>
          ))}
          <button style={styles.playBtn} onClick={() => setView('home')}>AGAIN</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', background: '#000', color: 'white', padding: '20px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  logo: { color: '#E50914', margin: 0 },
  userBadge: { background: '#222', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem' },
  searchInput: { width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #333', background: '#111', color: '#fff' },
  artistGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '20px' },
  artistCard: { textAlign: 'center' },
  artistImg: { width: '100%', borderRadius: '50%' },
  playBtn: { width: '100%', padding: '15px', background: '#E50914', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: 'bold', marginTop: '10px' },
  glassCard: { background: '#111', padding: '30px', borderRadius: '20px', textAlign: 'center' },
  gameCard: { background: '#111', padding: '20px', borderRadius: '20px' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' },
  choiceBtn: { padding: '15px', background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '10px' },
  loginOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginInput: { padding: '15px', borderRadius: '10px', width: '80%', marginBottom: '10px' },
  loader: { height: '2px', background: '#E50914', width: '100%' },
  adSlot: { margin: '20px 0' },
  adPlaceholder: { minHeight: '100px', background: '#0a0a0a' }
};
