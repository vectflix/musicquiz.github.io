import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const API_URL = "https://music-guessing-api-v3.onrender.com"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium high-speed music guessing game designed for true audiophiles. Created by @vecteezy_1.",
  howToPlay: "Select an artist, listen to the clip, and guess the title. You have 10 rounds to prove your skills!",
  privacy: "Privacy Policy: We store high scores locally. No personal data is collected.",
  cookies: "Cookies Policy: We use cookies for analytics and personalized ads via Google AdSense."
};

// --- 💰 AD COMPONENT ---
const AdSlot = ({ id }) => {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, []);
  return (
    <div style={styles.adSlot}>
      <p style={{fontSize: '0.6rem', color: '#444', marginBottom: '8px'}}>ADVERTISEMENT</p>
      <div style={styles.adPlaceholder}>
        <ins className="adsbygoogle" 
             style={{ display: 'block' }} 
             data-ad-client="ca-pub-6249624506404198" 
             data-ad-slot={id} 
             data-ad-format="auto" 
             data-full-width-responsive="true"></ins>
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
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedArtistImg, setSelectedArtistImg] = useState('');
  const [countdown, setCountdown] = useState(null); 
  
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    if ((view === 'game' || view === 'ready') && allRounds[roundIndex]) {
      const audio = new Audio();
      audio.src = allRounds[roundIndex].preview;
      audio.preload = "auto";
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
    try {
      const res = await fetch(`${API_URL}/api/search/${searchTerm}`);
      const data = await res.json();
      setArtists(data);
    } catch (err) { console.error("Search failed"); }
    setLoading(false);
  };

  const startGameSetup = async (a) => {
    setLoading(true);
    setSelectedArtist(a.name);
    setSelectedArtistImg(a.picture_medium);
    try {
      const res = await fetch(`${API_URL}/api/game/setup/${a.id}`);
      const data = await res.json();
      setAllRounds(data);
      setScore(0);
      setRoundIndex(0);
      setCountdown(null);
      setView('ready');
    } catch (err) { alert("Server warming up!"); }
    setLoading(false);
  };

  const triggerCountdown = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setView('game');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const copyToClipboard = () => {
    const text = `I just scored ${score}/10 on ${selectedArtist} at VECTFLIX! 🎧🔥 \nPlay here: musicquiz-github-io.vercel.app`;
    navigator.clipboard.writeText(text);
    alert("Result copied to clipboard!");
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

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {!isLoggedIn && (
          <div style={styles.loginOverlay}>
            <div style={styles.glassCardResults}>
              <h2 style={{color: '#E50914', marginBottom: '10px'}}>VECTFLIX</h2>
              <p style={{fontSize: '0.9rem', opacity: 0.7}}>Enter username to start</p>
              <form onSubmit={handleLogin} style={{marginTop: '20px'}}>
                <input style={styles.loginInput} placeholder="Username..." value={tempName} onChange={(e) => setTempName(e.target.value)} maxLength={12} />
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
              <form onSubmit={handleSearch} style={styles.searchBox}>
                <input style={styles.searchBar} placeholder="Search artist..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <button type="submit" style={styles.searchBtn}>🔍</button>
              </form>
            </div>
            <h3 style={styles.sectionTitle}>Trending</h3>
            {loading ? <div style={styles.loader}>🎧 LOADING...</div> : (
              <div style={styles.artistGrid}>
                {artists.map(a => (
                  <div key={a.id} style={styles.artistCard} onClick={() => startGameSetup(a)}>
                    <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                    <p style={styles.artistName}>{a.name}</p>
                  </div>
                ))}
              </div>
            )}
            <AdSlot id="home_banner" />
            
            <div style={styles.legalSection}>
              <h4 style={styles.legalHeading}>About VECTFLIX</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.about}</p>
              <h4 style={styles.legalHeading}>Privacy & Cookies</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.cookies}</p>
            </div>
          </main>
        )}

        {view === 'ready' && (
          <div style={styles.glassCardResults}>
            <img src={selectedArtistImg} style={styles.resultsArtistImg} alt="artist" />
            <h2 style={{margin: '10px 0'}}>{selectedArtist}</h2>
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
            <h4 style={{opacity: 0.5, letterSpacing: '2px'}}>GAME OVER</h4>
            <h2 style={{fontSize: '3.5rem', margin: '10px 0'}}>{score}/10</h2>
            <div style={styles.leaderboardBox}>
               <h4 style={styles.leaderboardTitle}>GLOBAL TOP 5</h4>
               {leaderboard.map((entry, i) => (
                 <div key={i} style={styles.leaderboardRow}><span>{i+1}. {entry.name}</span><span style={{color: '#E50914'}}>{entry.score} pts</span></div>
               ))}
            </div>

            <div style={styles.discoveryBox}>
              <p style={{fontSize: '0.6rem', opacity: 0.5, marginBottom: '8px'}}>LISTEN ON</p>
              <a href={`https://music.apple.com/search?term=${selectedArtist}`} target="_blank" rel="noreferrer" style={{...styles.affiliateBtn, background: '#fff', color: '#000'}}>🍎 Apple Music</a>
              <a href={`https://open.spotify.com/search/${selectedArtist}`} target="_blank" rel="noreferrer" style={{...styles.affiliateBtn, background: '#1DB954', color: '#fff'}}>🎧 Spotify</a>
            </div>

            <button style={{...styles.playBtn, background: '#1da1f2', marginTop: '15px'}} onClick={() => setView('share')}>SHARE RESULT</button>
            <button style={{...styles.playBtn, marginTop: '10px'}} onClick={() => setView('home')}>PLAY AGAIN</button>
            <AdSlot id="results_banner" />
          </div>
        )}

        {view === 'share' && (
          <div style={styles.sharePage}>
            <div style={styles.shareCard}>
              <div style={{color: '#E50914', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '3px', marginBottom: '15px'}}>VECTFLIX</div>
              
              {/* ARTIST SECTION FIXED */}
              <div style={{position: 'relative', width: '150px', height: '150px', margin: '0 auto 15px auto'}}>
                <img src={selectedArtistImg} style={styles.shareArtistImg} alt={selectedArtist} />
                <div style={styles.verifiedBadge}>✔️</div>
              </div>
              
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}>
                 <h2 style={{margin: '0', fontSize: '1.6rem'}}>{selectedArtist}</h2>
              </div>
              <p style={{fontSize: '0.7rem', color: '#E50914', marginTop: '5px', fontWeight: 'bold', letterSpacing: '1px'}}>VERIFIED ARTIST</p>
              
              <div style={{fontSize: '4.5rem', fontWeight: 'bold', color: '#E50914', margin: '10px 0'}}>{score}/10</div>
              
              <p style={{opacity: 0.7, fontSize: '0.9rem', fontStyle: 'italic'}}>“Can you beat my high score?”</p>
              
              <div style={{marginTop: '20px', padding: '12px', borderTop: '1px solid #333', width: '90%', fontSize: '0.65rem', opacity: 0.5}}>
                musicquiz-github-io.vercel.app
              </div>
            </div>
            
            <p style={{fontSize: '0.8rem', margin: '20px 0', opacity: 0.8}}>Screenshot & tag **@vecteezy_1**</p>
            <button style={{...styles.playBtn, background: '#222', marginBottom: '10px'}} onClick={copyToClipboard}>📋 COPY TEXT SCORE</button>
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
  header: { padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  logo: { color: '#E50914', fontSize: '1.5rem', fontWeight: 'bold' },
  userBadge: { background: '#222', padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem' },
  heroSection: { marginBottom: '30px' },
  heroText: { fontSize: '2rem' },
  searchBox: { display: 'flex', background: '#222', borderRadius: '15px', padding: '5px 10px', marginTop: '15px' },
  searchBar: { flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '12px', outline: 'none' },
  searchBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' },
  sectionTitle: { fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase', marginBottom: '15px' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  artistCard: { textAlign: 'center', cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '50%', border: '2px solid #222' },
  artistName: { fontSize: '0.7rem', marginTop: '5px' },
  gameCard: { background: '#111', padding: '20px', borderRadius: '20px', textAlign: 'center' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '15px', background: '#222', color: 'white', border: 'none', borderRadius: '10px', textAlign: 'left', cursor: 'pointer' },
  glassCardResults: { background: '#111', padding: '30px', borderRadius: '30px', textAlign: 'center' },
  resultsArtistImg: { width: '80px', borderRadius: '50%', marginBottom: '10px' },
  playBtn: { width: '100%', padding: '15px', background: '#E50914', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  leaderboardBox: { margin: '20px 0', background: '#000', padding: '15px', borderRadius: '10px', textAlign: 'left' },
  leaderboardRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '5px 0' },
  discoveryBox: { marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px' },
  affiliateBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' },
  sharePage: { textAlign: 'center' },
  shareCard: { background: '#111', padding: '40px 20px', borderRadius: '30px', border: '2px solid #E50914', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
  shareArtistImg: { width: '100%', height: '100%', borderRadius: '50%', border: '4px solid #E50914', objectFit: 'cover' },
  verifiedBadge: { position: 'absolute', bottom: '8px', right: '8px', background: '#1da1f2', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', border: '3px solid #111', boxShadow: '0 0 10px rgba(29, 161, 242, 0.5)' },
  adSlot: { margin: '20px 0', textAlign: 'center' },
  adPlaceholder: { minHeight: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px' },
  legalSection: { marginTop: '40px', borderTop: '1px solid #222', paddingTop: '20px', textAlign: 'left' },
  legalHeading: { fontSize: '0.7rem', textTransform: 'uppercase', color: '#E50914', marginBottom: '5px' },
  legalBody: { fontSize: '0.6rem', marginBottom: '15px', opacity: 0.5, lineHeight: '1.4' },
  loginOverlay: { position: 'fixed', top:0, left:0, right:0, bottom:0, background:'#000', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  loginInput: { width: '100%', padding: '15px', background: '#222', border: 'none', borderRadius: '10px', color: 'white', textAlign: 'center', outline: 'none' },
  loader: { textAlign: 'center', color: '#E50914', padding: '20px' },
  footer: { textAlign: 'center', marginTop: '40px', paddingBottom: '20px' },
  instaLink: { color: '#444', textDecoration: 'none', fontSize: '0.8rem' }
};
