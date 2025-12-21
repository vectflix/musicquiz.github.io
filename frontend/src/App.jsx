import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const API_URL = "https://music-guessing-api-v3.onrender.com"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium high-speed music guessing game designed for true audiophiles. Created by @vecteezy_1.",
  howToPlay: "Select an artist, listen to the clip, and guess the title. You have 10 rounds to prove your skills!",
  privacy: "Privacy Policy: We store high scores locally.",
  cookies: "Cookies Policy: We use cookies for ads via Google AdSense."
};

const AdSlot = ({ id }) => {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, []);
  return (
    <div style={styles.adSlot}>
      <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-6249624506404198" data-ad-slot={id} data-ad-format="auto" data-full-width-responsive="true"></ins>
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
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedArtistImg, setSelectedArtistImg] = useState('');
  const [countdown, setCountdown] = useState(null); 
  
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    if ((view === 'game' || view === 'ready') && allRounds[roundIndex]) {
      new Audio(allRounds[roundIndex].preview).preload = "auto";
    }
  }, [roundIndex, view, allRounds]);

  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(setArtists);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      localStorage.setItem('vectflix_user', tempName);
      setUsername(tempName);
      setIsLoggedIn(true);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    const res = await fetch(`${API_URL}/api/search/${searchTerm}`);
    const data = await res.json();
    setArtists(data);
    setLoading(false);
  };

  const startGameSetup = async (a) => {
    setLoading(true);
    setSelectedArtist(a.name);
    setSelectedArtistImg(a.picture_medium);
    const res = await fetch(`${API_URL}/api/game/setup/${a.id}`);
    const data = await res.json();
    setAllRounds(data);
    setScore(0); setRoundIndex(0); setView('ready');
    setLoading(false);
  };

  const triggerCountdown = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); setView('game'); return null; }
        return prev - 1;
      });
    }, 1000);
  };

  const updateLeaderboard = async (finalScore) => {
    const res = await fetch(`${API_URL}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: username || "Guest", score: finalScore })
    });
    setLeaderboard(await res.json());
  };

  const handleAnswer = (wasCorrect) => {
    const newScore = wasCorrect ? score + 1 : score;
    if (wasCorrect) setScore(newScore);
    if (roundIndex < 9) {
      setRoundIndex(prev => prev + 1);
    } else {
      setView('results');
      updateLeaderboard(newScore);
    }
  };

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        {!isLoggedIn && (
          <div style={styles.loginOverlay}>
            <div style={styles.glassCardResults}>
              <h2 style={{color: '#E50914'}}>VECTFLIX</h2>
              <form onSubmit={handleLogin} style={{marginTop: '20px'}}>
                <input style={styles.loginInput} placeholder="Username..." value={tempName} onChange={(e) => setTempName(e.target.value)} maxLength={12} />
                <button type="submit" style={styles.playBtn}>ENTER</button>
              </form>
            </div>
          </div>
        )}

        <header style={styles.header} onClick={() => setView('home')}>
          <h1 style={styles.logo}>VECTFLIX</h1>
          {isLoggedIn && <div style={styles.userBadge}>👤 {username}</div>}
        </header>

        {view === 'home' && (
          <main>
            <div style={styles.heroSection}>
              <h2 style={styles.heroText}>Guess the <span style={{color:'#E50914'}}>Hit</span></h2>
              <form onSubmit={handleSearch} style={styles.searchBox}>
                <input style={styles.searchBar} placeholder="Search artist..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <button type="submit" style={styles.searchBtn}>🔍</button>
              </form>
            </div>
            <div style={styles.artistGrid}>
              {artists.map(a => (
                <div key={a.id} style={styles.artistCard} onClick={() => startGameSetup(a)}>
                  <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                  <p style={styles.artistName}>{a.name}</p>
                </div>
              ))}
            </div>
            <AdSlot id="home_banner" />
          </main>
        )}

        {view === 'ready' && (
          <div style={styles.glassCardResults}>
            <img src={selectedArtistImg} style={styles.resultsArtistImg} alt="artist" />
            <h2>{selectedArtist}</h2>
            <button style={{...styles.playBtn, background: countdown ? '#555' : '#E50914'}} onClick={triggerCountdown} disabled={countdown !== null}>
              {countdown ? countdown : "START GAME"}
            </button>
          </div>
        )}

        {view === 'game' && allRounds[roundIndex] && (
          <GameRound key={roundIndex} roundData={allRounds[roundIndex]} roundNum={roundIndex + 1} onAnswer={handleAnswer} />
        )}

        {view === 'results' && (
          <div style={styles.glassCardResults}>
            <h4 style={{opacity: 0.5}}>GAME OVER</h4>
            <h2 style={{fontSize: '3rem'}}>{score}/10</h2>
            <div style={styles.leaderboardBox}>
               <h4 style={styles.leaderboardTitle}>TOP 5</h4>
               {leaderboard.map((entry, i) => (
                 <div key={i} style={styles.leaderboardRow}><span>{entry.name}</span><span>{entry.score} pts</span></div>
               ))}
            </div>
            {/* GO TO SHARE PAGE */}
            <button style={{...styles.playBtn, background: '#1da1f2'}} onClick={() => setView('share')}>SHARE RESULT</button>
            <button style={{...styles.playBtn, marginTop: '10px'}} onClick={() => setView('home')}>RETRY</button>
          </div>
        )}

        {/* --- NEW: THE SHARE PAGE --- */}
        {view === 'share' && (
          <div style={styles.sharePage}>
            <div id="capture-card" style={styles.shareCard}>
              <h1 style={{color: '#E50914', fontSize: '1rem'}}>VECTFLIX</h1>
              <img src={selectedArtistImg} style={{width: '100px', borderRadius: '50%', border: '4px solid #E50914'}} alt="artist" />
              <h2 style={{margin: '10px 0'}}>{selectedArtist}</h2>
              <div style={{fontSize: '2.5rem', fontWeight: 'bold'}}>{score}/10</div>
              <p style={{opacity: 0.6}}>Can you beat me?</p>
              <p style={{fontSize: '0.6rem', marginTop: '15px'}}>musicquiz-github-io.vercel.app</p>
            </div>
            
            <p style={{fontSize: '0.8rem', margin: '20px 0'}}>Screenshot this to share on IG!</p>
            <button style={styles.playBtn} onClick={() => setView('results')}>← BACK</button>
          </div>
        )}

        <footer style={styles.footer}>
          <a href="https://instagram.com/vecteezy_1" style={styles.instaLink}>Created by @vecteezy_1</a>
        </footer>
      </div>
    </div>
  );
}

function GameRound({ roundData, roundNum, onAnswer }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const audioRef = useRef(new Audio(roundData.preview));
  useEffect(() => {
    audioRef.current.play().catch(() => {});
    const timer = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { onAnswer(false); return 0; } return t - 1; });
    }, 1000);
    return () => { clearInterval(timer); audioRef.current.pause(); };
  }, [roundData]);
  return (
    <div style={styles.gameCard}>
      <p>ROUND {roundNum}/10 • {timeLeft}s</p>
      <div style={styles.choicesGrid}>
        {roundData.choices.map(c => (
          <button key={c.id} style={styles.choiceBtn} onClick={() => onAnswer(c.id === roundData.correctId)}>{c.title}</button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', background: '#000', color: 'white', fontFamily: 'sans-serif' },
  container: { maxWidth: '400px', margin: '0 auto', padding: '20px' },
  header: { padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  logo: { color: '#E50914', fontSize: '1.5rem', fontWeight: 'bold' },
  userBadge: { background: '#222', padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem' },
  heroSection: { marginBottom: '30px' },
  heroText: { fontSize: '2rem' },
  searchBox: { display: 'flex', background: '#222', borderRadius: '15px', padding: '5px 10px', marginTop: '15px' },
  searchBar: { flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '12px', outline: 'none' },
  searchBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  artistCard: { textAlign: 'center', cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '50%' },
  artistName: { fontSize: '0.7rem', marginTop: '5px' },
  gameCard: { background: '#111', padding: '20px', borderRadius: '20px', textAlign: 'center' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '15px', background: '#222', color: 'white', border: 'none', borderRadius: '10px', textAlign: 'left' },
  glassCardResults: { background: '#111', padding: '30px', borderRadius: '30px', textAlign: 'center' },
  resultsArtistImg: { width: '80px', borderRadius: '50%', marginBottom: '10px' },
  playBtn: { width: '100%', padding: '15px', background: '#E50914', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  leaderboardBox: { margin: '20px 0', background: '#000', padding: '15px', borderRadius: '10px', textAlign: 'left' },
  leaderboardRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '5px 0' },
  sharePage: { textAlign: 'center', padding: '10px' },
  shareCard: { background: '#111', padding: '40px 20px', borderRadius: '20px', border: '1px solid #333', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  footer: { textAlign: 'center', marginTop: '40px' },
  instaLink: { color: '#444', textDecoration: 'none', fontSize: '0.8rem' }
};
