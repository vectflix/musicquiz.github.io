import React, { useState, useEffect, useRef } from 'react';

const API_URL = "https://music-guessing-api-v3.onrender.com"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium high-speed music guessing game designed for true audiophiles. Using the official Deezer API, we provide high-quality 30-second song previews to test your knowledge of your favorite artists in real-time. Created by @vecteezy_1.",
  howToPlay: "Select an artist, listen to the clip, and guess the title. You have 10 rounds to prove your skills!",
  privacy: "Privacy Policy: We store high scores locally. No personal data is collected.",
  cookies: "Cookies Policy: We use cookies for analytics and personalized ads via Google AdSense."
};

const AdSlot = ({ id }) => {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, []);
  return (
    <div style={styles.adSlot}>
      <p style={{fontSize: '0.6rem', color: '#444', marginBottom: '8px'}}>ADVERTISEMENT</p>
      <ins className="adsbygoogle" 
           style={{ display: 'block' }} 
           data-ad-client="ca-pub-6249624506404198" 
           data-ad-slot={id} 
           data-ad-format="auto" 
           data-full-width-responsive="true"></ins>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // RE-ADDED PEAK SEARCH
  const [artists, setArtists] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedArtistImg, setSelectedArtistImg] = useState('');
  
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    if ((view === 'game') && allRounds[roundIndex + 1]) {
      const audio = new Audio();
      audio.src = allRounds[roundIndex + 1].preview;
      audio.preload = "auto";
    }
  }, [roundIndex, view, allRounds]);

  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(setArtists);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    const res = await fetch(`${API_URL}/api/search/${searchTerm}`);
    const data = await res.json();
    setArtists(data);
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      localStorage.setItem('vectflix_user', tempName);
      setUsername(tempName);
      setIsLoggedIn(true);
    }
  };

  const updateLeaderboard = async (finalScore) => {
    try {
      const res = await fetch(`${API_URL}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username || "Guest", score: finalScore })
      });
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) { console.error("Leaderboard error"); }
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

  const startGame = async (a) => {
    setLoading(true);
    setSelectedArtist(a.name);
    setSelectedArtistImg(a.picture_medium);
    const res = await fetch(`${API_URL}/api/game/setup/${a.id}`);
    const data = await res.json();
    setAllRounds(data);
    setScore(0); setRoundIndex(0); setView('game');
    setLoading(false);
  };

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        {!isLoggedIn && (
          <div style={styles.loginOverlay}>
            <div style={styles.glassCardResults}>
              <h2 style={{color: '#E50914', marginBottom: '10px'}}>VECTFLIX</h2>
              <p style={{fontSize: '0.9rem', opacity: 0.7}}>Enter username to start</p>
              <form onSubmit={handleLogin} style={{marginTop: '20px'}}>
                <input 
                  style={styles.loginInput} 
                  placeholder="Username..." 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  maxLength={12}
                />
                <button type="submit" style={styles.playBtn}>ENTER GAME</button>
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
              {/* RE-ADDED SEARCH BAR */}
              <form onSubmit={handleSearch} style={styles.searchBox}>
                <input 
                  style={styles.searchBar} 
                  placeholder="Search artist..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <button type="submit" style={styles.searchBtn}>🔍</button>
              </form>
            </div>

            <h3 style={styles.sectionTitle}>Trending Artists</h3>
            {loading ? <div style={styles.loader}>🎧 PREPARING...</div> : (
              <div style={styles.artistGrid}>
                {artists.map(a => (
                  <div key={a.id} style={styles.artistCard} onClick={() => startGame(a)}>
                    <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                    <p style={styles.artistName}>{a.name}</p>
                  </div>
                ))}
              </div>
            )}
            
            <AdSlot id="home_banner" />

            <div style={styles.legalSection}>
              <h4 style={styles.legalHeading}>How to Play</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.howToPlay}</p>
              <h4 style={styles.legalHeading}>Privacy & Cookies</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.cookies}</p>
            </div>
          </main>
        )}

        {view === 'game' && allRounds[roundIndex] && (
          <GameRound key={roundIndex} roundData={allRounds[roundIndex]} roundNum={roundIndex + 1} onAnswer={handleAnswer} />
        )}

        {view === 'results' && (
          <div style={styles.glassCardResults}>
            <img src={selectedArtistImg} style={styles.resultsArtistImg} alt="artist" />
            <h2 style={{fontSize: '3rem'}}>{score}/10</h2>
            <div style={styles.leaderboardBox}>
               <h4 style={styles.leaderboardTitle}>GLOBAL TOP 5</h4>
               {leaderboard.map((entry, i) => (
                 <div key={i} style={styles.leaderboardRow}>
                   <span>{i+1}. {entry.name}</span>
                   <span style={{color: '#E50914'}}>{entry.score} pts</span>
                 </div>
               ))}
            </div>
            <button style={styles.playBtn} onClick={() => setView('home')}>PLAY AGAIN</button>
            <AdSlot id="results_banner" />
          </div>
        )}

        {/* IG HANDLE RE-ADDED */}
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
    const audio = audioRef.current;
    audio.play().catch(() => {});
    const timer = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { onAnswer(false); return 0; } return t - 1; });
    }, 1000);
    return () => { clearInterval(timer); audio.pause(); };
  }, [roundData]);

  return (
    <div style={styles.gameCard}>
      <p style={{fontWeight:'bold', marginBottom:'20px'}}>ROUND {roundNum}/10 • {timeLeft}s</p>
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
  header: { padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: '#E50914', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer' },
  userBadge: { background: '#222', padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem' },
  heroSection: { marginBottom: '30px' },
  heroText: { fontSize: '2rem', marginBottom: '15px' },
  searchBox: { display: 'flex', background: '#222', borderRadius: '15px', padding: '5px 10px', alignItems: 'center' },
  searchBar: { flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '12px', outline: 'none' },
  searchBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' },
  sectionTitle: { fontSize: '0.8rem', marginBottom: '15px', opacity: 0.5, textTransform: 'uppercase' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  artistCard: { textAlign: 'center', cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '50%', border: '2px solid #222' },
  artistName: { fontSize: '0.7rem', marginTop: '5px' },
  gameCard: { background: '#111', padding: '20px', borderRadius: '20px', textAlign: 'center' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '15px', background: '#222', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' },
  glassCardResults: { background: '#111', padding: '30px', borderRadius: '30px', textAlign: 'center' },
  resultsArtistImg: { width: '80px', borderRadius: '50%', marginBottom: '10px' },
  playBtn: { width: '100%', padding: '15px', background: '#E50914', color: 'white', border: 'none', borderRadius: '10px', marginTop: '20px', fontWeight: 'bold', cursor: 'pointer' },
  leaderboardBox: { margin: '20px 0', background: '#000', padding: '15px', borderRadius: '10px', textAlign: 'left' },
  leaderboardTitle: { fontSize: '0.7rem', opacity: 0.5, marginBottom: '10px' },
  leaderboardRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '5px 0' },
  legalSection: { marginTop: '40px', opacity: 0.4 },
  legalHeading: { fontSize: '0.7rem', textTransform: 'uppercase' },
  legalBody: { fontSize: '0.6rem', marginBottom: '10px' },
  adSlot: { margin: '20px 0', minHeight: '100px', background: '#0a0a0a' },
  loginOverlay: { position: 'fixed', top:0, left:0, right:0, bottom:0, background:'#000', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  loginInput: { width: '100%', padding: '15px', background: '#222', border: 'none', borderRadius: '10px', color: 'white', textAlign: 'center' },
  loader: { textAlign: 'center', padding: '20px', color: '#E50914' },
  footer: { textAlign: 'center', marginTop: '40px' },
  instaLink: { color: '#444', textDecoration: 'none', fontSize: '0.8rem' }
};
