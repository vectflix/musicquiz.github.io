import React, { useState, useEffect } from 'react';
import styles from './AppStyles'; // External Peak Styles

const API_URL = "https://music-guessing-api-v3.onrender.com"; 
const APPLE_TOKEN = "YOUR_TOKEN_HERE"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium, high-speed music recognition platform engineered by @vecteezy_1 for a global community of audiophiles. Our mission is to provide a seamless, low-latency environment where users can test their musical knowledge against a massive global database in real-time. By leveraging the VECTFLIX Peak Audio Engine, we deliver high-fidelity track previews and instant scoring, bridging the gap between casual listening and competitive gaming through a sleek, minimalist interface.",
  howToPlay: "To begin your experience, search for any global artist using the integrated search bar. Once an artist is selected, our engine will optimize the audio catalog during a mandatory 5-second buffer to ensure lag-free play. You will face 10 high-intensity rounds where you must identify the correct track title from the audio clip provided. Every correct guess increases your standing. After the final round, you can finalize your score and see where you rank on the Global Hall of Fame.",
  privacy: "Privacy Policy: Privacy is a core pillar of the VECTFLIX experience. We prioritize user integrity by operating on a (no-data-collection) model. We do not require emails, passwords, or personal identifiers. Your chosen nickname is stored locally on your device to maintain your session, and competitive scores are transmitted via secure, encrypted protocols to our Render-hosted API solely for leaderboard placement. We never sell, track, or share your personal activity with third parties.",
  cookies: "Cookies Policy: VECTFLIX utilizes essential cookies and local storage technologies to ensure the platform operates at peak performance. These cookies are used to cache game states, preserve your high scores, and optimize audio buffering speeds. Additionally, we integrate Google AdSense, which may utilize non-personalized cookies to serve relevant advertisements. These ads allow us to keep the VECTFLIX engine free for all users. By continuing to use the platform, you consent to these high-speed data caching technologies."
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [appMode, setAppMode] = useState('game'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [newsData, setNewsData] = useState([]); 
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');

  // 1. POPULATE HOME PAGE ON LOAD
  useEffect(() => {
    // Fetch Top Artists so Home Page is not empty
    fetch(`${API_URL}/api/spotify/top-streamed`)
      .then(res => res.json())
      .then(data => {
        setArtists(data.map(a => ({
          id: a.name,
          name: a.name,
          picture_medium: a.image || 'https://via.placeholder.com/150'
        })));
      })
      .catch(e => console.error("Warming up server..."));

    fetch(`${API_URL}/api/leaderboard`)
      .then(res => res.json())
      .then(data => setLeaderboard(data));
  }, []);

  // 2. SEARCH LOGIC
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        fetch(`${API_URL}/api/search/artists?q=${encodeURIComponent(searchTerm)}`)
          .then(res => res.json())
          .then(data => setArtists(data));
      }
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // 3. BILLBOARD NEWS (NO THUMBNAILS)
  useEffect(() => {
    if (appMode === 'news' && newsData.length === 0) {
      fetch(`${API_URL}/api/news`)
        .then(res => res.json())
        .then(data => setNewsData(data));
    }
  }, [appMode]);

  const handleHomeReturn = () => { setView('home'); setSearchTerm(''); setAppMode('game'); };

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {/* PEAK HEADER */}
        <header style={styles.header}>
          <h1 style={styles.logo} onClick={handleHomeReturn}>VECTFLIX</h1>
          <div style={styles.searchContainer}>
            <input 
              type="text" 
              placeholder="Search Artists..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={styles.searchInput} 
            />
          </div>
          {isLoggedIn && <div style={styles.userBadge}>👤 {username}</div>}
        </header>

        {view === 'home' && (
          <main>
            <div style={styles.modeToggle}>
              <button style={{...styles.modeBtn, ...(appMode === 'game' ? styles.activeMode : {})}} onClick={() => setAppMode('game')}>🎮 GAME</button>
              <button style={{...styles.modeBtn, ...(appMode === 'news' ? styles.activeMode : {})}} onClick={() => setAppMode('news')}>📰 NEWS</button>
            </div>

            {appMode === 'news' ? (
              <div style={styles.newsSection}>
                <h2 style={styles.heroText}>Billboard <span style={{color: '#E50914'}}>Peak News</span></h2>
                <div style={styles.newsList}>
                  {newsData.map((item, index) => (
                    <div key={index} style={{padding: '15px 0', borderBottom: '1px solid #333'}}>
                      {/* PEAK: STRICTLY NO THUMBNAILS */}
                      <h4 style={{color: '#fff', margin: '0 0 5px 0'}}>{item.title}</h4>
                      <p style={{fontSize: '0.75rem', opacity: 0.5}}>{item.pubDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={styles.artistGrid}>
                {artists.map((a, i) => (
                  <div key={i} style={styles.artistCard} onClick={() => alert("Setting up " + a.name)}>
                    <img src={a.picture_medium} style={styles.artistImg} alt="" />
                    <p style={styles.artistName}>{a.name}</p>
                  </div>
                ))}
              </div>
            )}

            {/* PEAK FOOTER CONTENT (FROM PREVIOUS) */}
            <div style={styles.legalSection}>
              <h4 style={styles.legalHeading}>About VECTFLIX</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.about}</p>
              <h4 style={styles.legalHeading}>How to Play</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.howToPlay}</p>
              <h4 style={styles.legalHeading}>Privacy Policy</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.privacy}</p>
              <h4 style={styles.legalHeading}>Cookies Policy</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.cookies}</p>
            </div>
          </main>
        )}

        {/* FOOTER BAR */}
        <footer style={styles.footer}>
          <div style={{display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '10px'}}>
             <span style={styles.instaLink}>🍪 Cookies</span> | 
             <span style={styles.instaLink}>👤 My Account</span> | 
             <span style={styles.instaLink}>📄 Terms</span>
          </div>
          <p style={{fontSize: '0.6rem', opacity: 0.4}}>VECTFLIX Peak Audio Engine © 2025</p>
        </footer>
      </div>
    </div>
  );
}
