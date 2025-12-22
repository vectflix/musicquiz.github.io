import React, { useState, useEffect } from 'react';
import styles from './AppStyles'; 

const API_URL = "https://music-guessing-api-v3.onrender.com"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium platform engineered by @vecteezy_1 for a global community of music lovers.",
  privacy: "Privacy Policy: We protect your data and do not share your history.",
  cookies: "Cookies Policy: VECTFLIX uses essential cookies to save your scores and login status."
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [appMode, setAppMode] = useState('game'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [spotifyTop50, setSpotifyTop50] = useState([]); 
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  // 1. Fetch Charts when in Charts Mode
  useEffect(() => {
    if (appMode === 'charts') {
      fetch(`${API_URL}/api/spotify/top-streamed`)
        .then(res => res.json())
        .then(data => setSpotifyTop50(Array.isArray(data) ? data : []));
    }
  }, [appMode]);

  // 2. Debounced Search for Artists
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        fetch(`${API_URL}/api/search/artists?q=${searchTerm}`)
          .then(res => res.json())
          .then(data => setArtists(data));
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // 3. Game Functions
  const startGame = async (a) => {
    const res = await fetch(`${API_URL}/api/game/setup/${a.id}`);
    const data = await res.json();
    setAllRounds(data); setScore(0); setRoundIndex(0); setView('game');
  }

  const handleAnswer = (isCorrect) => {
    if(isCorrect) setScore(s => s + 1);
    if(roundIndex < 9) setRoundIndex(r => r + 1);
    else finishGame();
  }

  const finishGame = async () => {
    setView('results');
    await fetch(`${API_URL}/api/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: username, score: score })
    });
  }

  const fetchRankings = () => {
    fetch(`${API_URL}/api/leaderboard`)
      .then(res => res.json())
      .then(data => setLeaderboard(data));
    setView('ranking');
  }

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {/* LOGIN SCREEN */}
        {!isLoggedIn && (
          <div style={styles.loginOverlay}>
            <div style={styles.glassCardResults}>
              <h2 style={{color: '#E50914', fontSize: '2.5rem'}}>VECTFLIX</h2>
              <input style={styles.loginInput} placeholder="Enter Username" value={tempName} onChange={(e) => setTempName(e.target.value)} />
              <button style={styles.playBtn} onClick={() => {if(tempName){localStorage.setItem('vectflix_user', tempName); setUsername(tempName); setIsLoggedIn(true);}}}>START EXPERIENCE</button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header style={styles.header} onClick={() => setView('home')}>
          <h1 style={styles.logo}>VECTFLIX</h1>
          {isLoggedIn && <div style={styles.userBadge}>👤 {username}</div>}
        </header>

        {view === 'home' && (
          <main>
            {/* SEARCHBAR & MODES */}
            <div style={styles.modeToggle}>
              <button style={appMode === 'game' ? styles.activeMode : styles.modeBtn} onClick={() => setAppMode('game')}>🎮 PLAY</button>
              <button style={appMode === 'charts' ? styles.activeMode : styles.modeBtn} onClick={() => setAppMode('charts')}>📈 CHARTS</button>
            </div>

            {appMode === 'game' && (
              <div style={styles.searchContainer}>
                <input placeholder="Search artist to play..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                <div style={styles.artistGrid}>
                  {artists.map(a => (
                    <div key={a.id} style={styles.artistCard} onClick={() => startGame(a)}>
                      <img src={a.picture_medium} style={styles.artistImg} alt="" />
                      <p>{a.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {appMode === 'charts' && (
              <div style={{padding: '20px'}}>
                <h3 style={{color: '#1DB954'}}>Global Top Streamed (Last.fm)</h3>
                {spotifyTop50.map((artist, index) => (
                  <div key={index} style={{display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', borderBottom: '1px solid #222'}}>
                    <span style={{color: '#1DB954', width: '25px'}}>{index + 1}</span>
                    <img src={artist.image} style={{width: '45px', borderRadius: '50%'}} alt="" />
                    <p>{artist.name}</p>
                  </div>
                ))}
              </div>
            )}

            {/* COOKIE POLICY SECTION */}
            <div style={styles.legalSection}>
              <p style={styles.legalBody}>{LEGAL_TEXT.cookies}</p>
            </div>
          </main>
        )}

        {/* GAME SCREEN */}
        {view === 'game' && allRounds[roundIndex] && (
          <div style={styles.gameCard}>
             <p>Round {roundIndex + 1}/10</p>
             <audio autoPlay src={allRounds[roundIndex].preview} />
             <div style={styles.choicesGrid}>
               {allRounds[roundIndex].choices.map(c => (
                 <button key={c.id} style={styles.choiceBtn} onClick={() => handleAnswer(c.id === allRounds[roundIndex].correctId)}>{c.title}</button>
               ))}
             </div>
          </div>
        )}

        {/* RESULTS & RANKING */}
        {view === 'results' && (
          <div style={styles.glassCardResults}>
            <h1>SCORE: {score}/10</h1>
            <button style={styles.playBtn} onClick={fetchRankings}>VIEW GLOBAL RANKING</button>
          </div>
        )}

        {view === 'ranking' && (
          <div style={styles.glassCardResults}>
            <h2>GLOBAL LEADERBOARD</h2>
            {leaderboard.map((r, i) => (
              <div key={i} style={{display: 'flex', justifyContent: 'space-between', width: '100%', borderBottom: '1px solid #333', padding: '8px 0'}}>
                <span>{i+1}. {r.name}</span><span>{r.score}/10</span>
              </div>
            ))}
            <button style={styles.playBtn} onClick={() => setView('home')}>BACK HOME</button>
          </div>
        )}

        {/* FOOTER */}
        <footer style={styles.footer}>
          <a href="#">About</a> | <a href="#">Privacy Policy</a> | <a href="#">Cookies</a>
        </footer>
      </div>
    </div>
  );
}
