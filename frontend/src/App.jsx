import React, { useState, useEffect } from 'react';
import styles from './AppStyles'; // External Peak Styles

const API_URL = "https://music-guessing-api-v3.onrender.com"; 
const APPLE_TOKEN = "YOUR_TOKEN_HERE"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium, high-speed music recognition platform engineered by @vecteezy_1 for a global community of audiophiles...",
  howToPlay: "To begin your experience, search for any global artist using the integrated search bar...",
  privacy: "Privacy Policy: Privacy is a core pillar of the VECTFLIX experience...",
  cookies: "Cookies Policy: VECTFLIX utilizes essential cookies and local storage technologies..."
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
  const [appMode, setAppMode] = useState('game'); 
  const [isFetchingArtists, setIsFetchingArtists] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [newsData, setNewsData] = useState([]); // Billboard News
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const [selectedArtist, setSelectedArtist] = useState(sessionStorage.getItem('v_name') || '');
  const [selectedArtistImg, setSelectedArtistImg] = useState(sessionStorage.getItem('v_img') || '');
  
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  // PEAK FIX: Fetch Billboard News via Server (Text-Only)
  const fetchMusicNews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/news`);
      const data = await res.json();
      setNewsData(data);
    } catch (e) { console.error("Billboard news failed"); }
  };

  useEffect(() => {
    if (appMode === 'news') fetchMusicNews();
  }, [appMode]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) searchGlobalArtists(searchTerm);
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchGlobalArtists = async (query) => {
    setIsFetchingArtists(true);
    try {
      const res = await fetch(`${API_URL}/api/search/artists?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setArtists(data);
    } catch (e) { console.error("Search failed"); }
    setIsFetchingArtists(false);
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leaderboard`);
      const data = await res.json();
      setLeaderboard(data);
    } catch (e) { console.error("Leaderboard failed"); }
  };

  const submitScore = async () => {
    if (!username) return;
    try {
      await fetch(`${API_URL}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, score: score })
      });
      fetchLeaderboard();
    } catch (e) { console.error("Score submission failed"); }
  };

  const startGameSetup = async (a) => {
    setIsFetchingArtists(true);
    setSelectedArtist(a.name);
    setSelectedArtistImg(a.picture_medium);
    try {
      const res = await fetch(`${API_URL}/api/game/setup/${a.id}`);
      const data = await res.json();
      setAllRounds(data);
      setScore(0);
      setRoundIndex(0);
      setView('ready');
      setCountdown(5); 
    } catch (err) { alert("Try another artist!"); }
    setIsFetchingArtists(false);
  }

  const handleAnswer = (wasCorrect) => {
    if (wasCorrect) setScore(prev => prev + 1);
    if (roundIndex < 9) setRoundIndex(prev => prev + 1);
    else { setView('results'); submitScore(); }
  };

  const handleHomeReturn = () => { setView('home'); setSearchTerm(''); setAppMode('game'); };

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {!isLoggedIn && (
          <div style={styles.loginOverlay}>
            <div style={styles.glassCardResults}>
              <h2 style={{color: '#E50914', letterSpacing: '4px'}}>VECTFLIX</h2>
              <input style={styles.loginInput} placeholder="Enter Username..." value={tempName} onChange={(e) => setTempName(e.target.value)} />
              <button style={styles.playBtn} onClick={() => {if(tempName){localStorage.setItem('vectflix_user', tempName); setUsername(tempName); setIsLoggedIn(true);}}}>ENTER PEAK</button>
            </div>
          </div>
        )}

        <header style={styles.header} onClick={handleHomeReturn}>
          <h1 style={styles.logo}>VECTFLIX</h1>
          {isLoggedIn && <div style={styles.userBadge}>👤 {username}</div>}
        </header>

        {view === 'home' && (
          <main>
            <div style={styles.modeToggle}>
              <button style={{...styles.modeBtn, ...(appMode === 'game' ? styles.activeMode : {})}} onClick={() => setAppMode('game')}>🎮 GAME</button>
              <button style={{...styles.modeBtn, ...(appMode === 'news' ? styles.activeMode : {})}} onClick={() => setAppMode('news')}>📰 NEWS</button>
            </div>

            {appMode === 'news' ? (
              <div style={{paddingBottom: '40px'}}>
                <h2 style={styles.heroText}>Billboard <span style={{color: '#E50914'}}>Peak News</span></h2>
                <div style={styles.newsList}>
                  {newsData.map((item, index) => (
                    <div key={index} style={{...styles.newsCard, padding: '15px', borderBottom: '1px solid #222'}}>
                      {/* PEAK: No Thumbnails as requested */}
                      <h4 style={{color: '#fff', margin: '0 0 5px 0'}}>{item.title}</h4>
                      <p style={{fontSize: '0.75rem', opacity: 0.5}}>{item.pubDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <h2 style={styles.heroText}>Guess the <span style={{color:'#E50914'}}>Hit</span></h2>
                <div style={styles.searchContainer}>
                  <input type="text" placeholder="Search global artists..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                </div>
                <div style={styles.artistGrid}>
                  {artists.map(a => (
                    <div key={a.id} style={styles.artistCard} onClick={() => startGameSetup(a)}>
                      <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                      <p style={styles.artistName}>{a.name}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* PEAK LEGAL SECTION */}
            <div style={styles.legalSection}>
              <h4 style={styles.legalHeading}>About VECTFLIX</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.about}</p>
              <h4 style={styles.legalHeading}>Privacy Policy</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.privacy}</p>
              <h4 style={styles.legalHeading}>Cookies Policy</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.cookies}</p>
            </div>
          </main>
        )}

        {/* ... Game/Ready/Results Views (Identical to your logic) ... */}
        {view === 'ranking' && (
          <div style={styles.glassCardResults}>
            <h2 style={{color: '#E50914', marginBottom: '20px'}}>GLOBAL RANKINGS</h2>
            <AdSlot id="4888078097" /> 
            <div style={{textAlign: 'left', marginBottom: '30px'}}>
              {leaderboard.map((r, i) => (
                <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #222'}}>
                  <span>{i+1}. {r.name}</span>
                  <span style={{color: '#E50914', fontWeight: 'bold'}}>{r.score}/10</span>
                </div>
              ))}
            </div>
            <button style={styles.playBtn} onClick={handleHomeReturn}>PLAY AGAIN</button>
          </div>
        )}

        <footer style={styles.footer}>
          <a href="#" style={styles.instaLink}>Cookies</a> | 
          <a href="#" style={styles.instaLink}>My Account</a> | 
          <a href="#" style={styles.instaLink}>Privacy</a>
        </footer>
      </div>
    </div>
  );
}
