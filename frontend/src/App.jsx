import React, { useState, useEffect } from 'react';
import styles from './AppStyles'; 

const API_URL = "https://music-guessing-api-v3.onrender.com"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium, high-speed music recognition platform engineered by @vecteezy_1 for a global community of audiophiles. Our mission is to provide a seamless, low-latency environment where users can test their musical knowledge against a massive global database in real-time. By leveraging the VECTFLIX Peak Audio Engine, we deliver high-fidelity track previews and instant scoring, bridging the gap between casual listening and competitive gaming through a sleek, minimalist interface.",
  howToPlay: "To begin your experience, search for any global artist using the integrated search bar. Once an artist is selected, our engine will optimize the audio catalog during a mandatory 5-second buffer to ensure lag-free play. You will face 10 high-intensity rounds where you must identify the correct track title from the audio clip provided. Every correct guess increases your standing. After the final round, you can finalize your score and see where you rank on the Global Hall of Fame.",
  privacy: "Privacy Policy: Privacy is a core pillar of the VECTFLIX experience. We prioritize user integrity by operating on a (no-data-collection) model. We do not require emails, passwords, or personal identifiers. Your chosen nickname is stored locally on your device to maintain your session, and competitive scores are transmitted via secure, encrypted protocols to our Render-hosted API solely for leaderboard placement. We never sell, track, or share your personal activity with third parties.",
  cookies: "Cookies Policy: VECTFLIX utilizes essential cookies and local storage technologies to ensure the platform operates at peak performance. These cookies are used to cache game states, preserve your high scores, and optimize audio buffering speeds. Additionally, we integrate Google AdSense, which may utilize non-personalized cookies to serve relevant advertisements. These ads allow us to keep the VECTFLIX engine free for all users. By continuing to use the platform, you consent to these high-speed data caching technologies."
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [appMode, setAppMode] = useState('game'); 
  const [activeModal, setActiveModal] = useState(null); 
  const [isFetching, setIsFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [newsData, setNewsData] = useState([]); // Real-time Deezer Charts
  
  const [username] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));

  // FETCH REAL-TIME DEEZER NEWS (CHARTS)
  const fetchMusicNews = async () => {
    setIsFetching(true);
    try {
      // Direct call to Deezer Editorial Charts for the 'News' feed
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://api.deezer.com/editorial/0/charts')}`);
      const json = await res.json();
      const data = JSON.parse(json.contents);
      setNewsData(data.albums.data || []);
    } catch (e) {
      console.error("News fetch failed");
    }
    setIsFetching(false);
  };

  useEffect(() => {
    if (appMode === 'news') fetchMusicNews();
    else if (searchTerm === '') fetchTopArtists();
  }, [appMode]);

  const fetchTopArtists = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`${API_URL}/api/artists`);
      const data = await res.json();
      setArtists(data.filter(a => a.name && a.picture_medium));
    } catch (e) { console.error("Server warming up..."); }
    setIsFetching(false);
  };

  const handleLegalClick = (e, modalType) => {
    e.preventDefault(); // Prevents the link from actually navigating to a 404
    setActiveModal(modalType);
  };

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        <header style={styles.header} onClick={() => setView('home')}>
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
                <h2 style={styles.heroText}>Trending <span style={{color: '#E50914'}}>Now</span></h2>
                <div style={styles.newsGrid}>
                  {newsData.map((item, index) => (
                    <div key={item.id} style={styles.newsCard}>
                      <img src={item.cover_medium} style={styles.newsImg} alt="news" />
                      <div style={styles.newsInfo}>
                        <span style={styles.newsTag}>TOP {index + 1}</span>
                        <h4 style={{margin: '5px 0'}}>{item.title}</h4>
                        <p style={{fontSize: '0.8rem', opacity: 0.6}}>by {item.artist.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <h2 style={styles.heroText}>Guess the <span style={{color:'#E50914'}}>Hit</span></h2>
                <div style={styles.searchContainer}>
                  <input type="text" placeholder="Search global artists..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
                  {isFetching && <div style={styles.loaderLine}></div>}
                </div>
                <div style={styles.artistGrid}>
                  {artists.map(a => (
                    <div key={a.id} style={styles.artistCard} onClick={() => {/* startGameSetup(a) */}}>
                      <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                      <p style={styles.artistName}>{a.name}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </main>
        )}

        {/* MODAL SYSTEM FOR LEGAL LINKS */}
        {activeModal && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
            <div style={{...styles.glassCardResults, maxWidth:'600px', textAlign:'left'}}>
               <h2 style={{color:'#E50914', textTransform: 'uppercase'}}>{activeModal.replace('-', ' ')}</h2>
               <p style={{lineHeight:'1.6', opacity:0.8, fontSize: '0.9rem', margin: '20px 0'}}>{LEGAL_TEXT[activeModal] || "Section coming soon..."}</p>
               <button style={styles.playBtn} onClick={() => setActiveModal(null)}>CLOSE</button>
            </div>
          </div>
        )}

        <footer style={styles.footer}>
          <div style={{marginBottom: '15px'}}>
            <a href="/about.html" onClick={(e) => handleLegalClick(e, 'about')} style={styles.instaLink}>About</a> | 
            <a href="/privacy-policy.html" onClick={(e) => handleLegalClick(e, 'privacy')} style={styles.instaLink}>Privacy Policy</a> | 
            <a href="/terms.html" onClick={(e) => handleLegalClick(e, 'howToPlay')} style={styles.instaLink}>Terms</a> | 
            <a href="/affiliate-disclosure.html" onClick={(e) => handleLegalClick(e, 'cookies')} style={styles.instaLink}>Affiliate Disclosure</a>
          </div>
          <p style={{fontSize: '0.7rem', opacity: 0.3}}>© 2025 VECTFLIX PEAK. Engineered for performance.</p>
        </footer>
      </div>
    </div>
  );
}
