import React, { useState, useEffect } from 'react';
import styles from './AppStyles'; // External Peak Styles

const API_URL = "https://music-guessing-api-v3.onrender.com"; 
const APPLE_TOKEN = "YOUR_TOKEN_HERE"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium, high-speed music recognition platform engineered by @vecteezy_1 for a global community of audiophiles. Our mission is to provide a seamless, low-latency environment where users can test their musical knowledge against a massive global database in real-time.",
  howToPlay: "Search for any global artist. In Game Mode, our engine optimizes the catalog for 10 rounds of high-intensity guessing. In Discover Mode, explore artists through high-fidelity video previews and genre-based curation.",
  privacy: "Privacy Policy: VECTFLIX operates on a no-data-collection model. We do not require emails or passwords. Your chosen nickname is stored locally to maintain your session, and scores are transmitted via secure protocols to our leaderboard.",
  cookies: "Cookies Policy: We use essential local storage to cache game states and preserve high scores. We integrate Google AdSense for non-personalized ads to keep the VECTFLIX engine free for all users."
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
  const [activeModal, setActiveModal] = useState(null); 
  const [isFetchingArtists, setIsFetchingArtists] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
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

  // PEAK DYNAMIC BACKGROUND EFFECT
  useEffect(() => {
    if (view === 'home') {
      document.body.style.background = 'radial-gradient(circle at top right, #2b0a0a, #000000, #050505)';
    }
  }, [view]);

  // PRE-LOADING AUDIO ENGINE
  useEffect(() => {
    if ((view === 'game' || view === 'ready') && allRounds.length > 0) {
      for (let i = 0; i <= 3; i++) {
        const targetRound = allRounds[roundIndex + i];
        if (targetRound && targetRound.preview) {
          const audioPreload = new Audio();
          audioPreload.src = targetRound.preview;
          audioPreload.preload = "auto";
        }
      }
    }
  }, [view, roundIndex, allRounds]);

  useEffect(() => {
    let timer;
    if (view === 'ready' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [view, countdown]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) searchGlobalArtists(searchTerm);
      else if (searchTerm.trim().length === 0) fetchTopArtists();
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchTopArtists = async () => {
    setIsFetchingArtists(true);
    try {
      const res = await fetch(`${API_URL}/api/artists`);
      const data = await res.json();
      setArtists(data.filter(a => a.name && a.picture_medium));
    } catch (e) { console.error("Server warming up..."); }
    setIsFetchingArtists(false);
  };

  const searchGlobalArtists = async (query) => {
    setIsFetchingArtists(true);
    try {
      const res = await fetch(`${API_URL}/api/search/artists?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setArtists(data.filter(item => (item.type === 'artist' || !item.type) && item.name && item.picture_medium));
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
    
    const hues = [0, 210, 280, 150, 45, 330]; 
    const selectedHue = hues[a.name.length % hues.length];
    document.body.style.background = `radial-gradient(circle at top right, hsla(${selectedHue}, 70%, 15%, 1), #000000, #050505)`;

    sessionStorage.setItem('v_name', a.name);
    sessionStorage.setItem('v_img', a.picture_medium);
    try {
      const res = await fetch(`${API_URL}/api/game/setup/${a.id}`);
      const data = await res.json();
      setAllRounds(data);
      setScore(0);
      setRoundIndex(0);
      setView('ready');
      setCountdown(5); 
    } catch (err) { alert("Artist not available for quiz. Try another!"); }
    setIsFetchingArtists(false);
  }

  const handleAnswer = (wasCorrect) => {
    if (wasCorrect) setScore(prev => prev + 1);
    if (roundIndex < 9) setRoundIndex(prev => prev + 1);
    else { setView('results'); submitScore(); }
  };

  const handleHomeReturn = () => { setView('home'); setSearchTerm(''); };

  // FIX FOR 404 ERROR ON LEGAL LINKS
  const handleLegalClick = (e, modalType) => {
    e.preventDefault();
    setActiveModal(modalType);
  };

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {!isLoggedIn && (
          <div style={styles.loginOverlay}>
            <div style={styles.glassCardResults}>
              <h2 style={{color: '#E50914', letterSpacing: '4px'}}>VECTFLIX</h2>
              <input style={styles.loginInput} placeholder="Username..." value={tempName} onChange={(e) => setTempName(e.target.value)} />
              <button style={styles.playBtn} onClick={() => {if(tempName){localStorage.setItem('vectflix_user', tempName); setUsername(tempName); setIsLoggedIn(true);}}}>ENTER</button>
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
              <button style={{...styles.modeBtn, ...(appMode === 'game' ? styles.activeMode : {})}} onClick={() => setAppMode('game')}>🎮 GAME MODE</button>
              <button style={{...styles.modeBtn, ...(appMode === 'discover' ? styles.activeMode : {})}} onClick={() => setAppMode('discover')}>📺 DISCOVER VIDEO</button>
            </div>

            <h2 style={styles.heroText}>
              {appMode === 'game' ? <>Guess the <span style={{color:'#E50914'}}>Hit</span></> : <>Video <span style={{color:'#E50914'}}>Previews</span></>}
            </h2>

            <div style={styles.searchContainer}>
              <input type="text" placeholder={appMode === 'game' ? "Search global artists..." : "Search videos..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
              {isFetchingArtists && <div style={styles.loaderLine}></div>}
            </div>

            {appMode === 'discover' && searchTerm === '' && (
              <div style={styles.genreGrid}>
                {['Pop', 'Hip-Hop', 'Rock', 'Afrobeats', 'R&B', 'Latin'].map(genre => (
                  <div key={genre} style={styles.genreCard} onClick={() => setSearchTerm(genre)}>{genre}</div>
                ))}
              </div>
            )}

            <div style={styles.artistGrid}>
              {artists.map(a => (
                <div key={a.id} style={styles.artistCard} onClick={() => {
                   if(appMode === 'game') startGameSetup(a);
                   else { setSelectedArtist(a.name); setSelectedArtistImg(a.picture_medium); setView('videoPlayer'); }
                }}>
                  <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                  <p style={styles.artistName}>{a.name}</p>
                  {appMode === 'discover' && <span style={{fontSize: '0.6rem', color: '#E50914', fontWeight: 'bold'}}>WATCH PREVIEW</span>}
                </div>
              ))}
            </div>

            <div style={styles.newsSection}>
              <h3 style={{fontSize: '1.5rem', fontWeight: '900'}}>Music <span style={{color: '#E50914'}}>Pulse</span></h3>
              <div style={styles.newsGrid}>
                <div style={styles.newsCard}>
                  <span style={styles.newsTag}>Trending</span>
                  <h4>Vinyl Revival 2025</h4>
                  <p style={{fontSize: '0.8rem', opacity: 0.5}}>Sales records broken by global icons.</p>
                </div>
                <div style={styles.newsCard}>
                  <span style={styles.newsTag}>Live</span>
                  <h4>Tour Updates</h4>
                  <p style={{fontSize: '0.8rem', opacity: 0.5}}>New 2026 dates added for major festivals.</p>
                </div>
              </div>
            </div>

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

        {view === 'videoPlayer' && (
          <div style={styles.glassCardResults}>
            <div style={styles.videoContainer}>
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed?q=${encodeURIComponent(selectedArtist + " music video")}&autoplay=1`} 
                frameBorder="0" 
                allow="autoplay; encrypted-media" 
                allowFullScreen
              ></iframe>
            </div>
            <h2 style={{margin: '20px 0'}}>{selectedArtist}</h2>
            <button style={styles.playBtn} onClick={() => setView('home')}>EXIT PLAYER</button>
          </div>
        )}

        {/* ... (Keep Ready, Game, Results, Share, Ranking views from previous version) ... */}
        {/* Note: In your full code, include the full Ready/Game/Results logic here */}

        {activeModal && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
            <div style={{...styles.glassCardResults, maxWidth:'700px', textAlign:'left'}}>
               <h2 style={{color:'#E50914'}}>{activeModal.toUpperCase()}</h2>
               <p style={{lineHeight:'1.6', opacity:0.8}}>{LEGAL_TEXT[activeModal]}</p>
               <button style={styles.playBtn} onClick={() => setActiveModal(null)}>CLOSE</button>
            </div>
          </div>
        )}

        <footer style={styles.footer}>
          <div style={{marginBottom: '15px'}}>
            <a href="/about" onClick={(e) => handleLegalClick(e, 'about')} style={styles.instaLink}>About</a>
            <a href="/privacy" onClick={(e) => handleLegalClick(e, 'privacy')} style={styles.instaLink}>Privacy</a>
            <a href="/terms" onClick={(e) => handleLegalClick(e, 'terms')} style={styles.instaLink}>Terms</a>
            <a href="/cookies" onClick={(e) => handleLegalClick(e, 'cookies')} style={styles.instaLink}>Cookies</a>
          </div>
          <p style={{fontSize: '0.7rem', opacity: 0.3}}>© 2025 VECTFLIX PEAK ENGINE. Engineered for performance.</p>
        </footer>
      </div>
    </div>
  );
}
