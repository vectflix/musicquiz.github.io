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
  const [appMode, setAppMode] = useState('game'); // NEW: Game vs Discover
  const [activeModal, setActiveModal] = useState(null); // Fixes 404
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

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {/* LOGIN OVERLAY */}
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
            {/* PEAK MODE TOGGLE */}
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

            {/* GENRE GRID (Discover Only) */}
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

            {/* MUSIC PULSE NEWS */}
            <div style={styles.newsSection}>
              <h3 style={{fontSize: '1.5rem', fontWeight: '900'}}>Music <span style={{color: '#E50914'}}>Pulse</span></h3>
              <div style={styles.newsGrid}>
                <div style={styles.newsCard}>
                  <span style={styles.newsTag}>Trending</span>
                  <h4>The Vinyl Record Surge 2025</h4>
                  <p style={{fontSize: '0.8rem', opacity: 0.5}}>Physical media sales hit a 30-year high this December.</p>
                </div>
                <div style={styles.newsCard}>
                  <span style={styles.newsTag}>Live</span>
                  <h4>World Tour 2026 Updates</h4>
                  <p style={{fontSize: '0.8rem', opacity: 0.5}}>Stadium dates for top artists are being finalized now.</p>
                </div>
              </div>
            </div>

            {/* LEGAL SECTION */}
            <div style={styles.legalSection}>
              <h4 style={styles.legalHeading}>About VECTFLIX</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.about}</p>
            </div>
          </main>
        )}

        {/* VIDEO PLAYER VIEW */}
        {view === 'videoPlayer' && (
          <div style={styles.glassCardResults}>
            <div style={styles.videoContainer}>
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(selectedArtist + " official music video")}`} frameBorder="0" allowFullScreen></iframe>
            </div>
            <h2 style={{margin: '20px 0'}}>{selectedArtist}</h2>
            <button style={styles.playBtn} onClick={() => setView('home')}>EXIT PLAYER</button>
          </div>
        )}

        {/* GAME ENGINE VIEWS (READY, GAME, RESULTS, SHARE, RANKING) */}
        {view === 'ready' && (
          <div style={styles.glassCardResults}>
            <img src={selectedArtistImg} style={styles.resultsArtistImg} alt="artist" />
            <h2 style={{margin: '10px 0'}}>{selectedArtist}</h2>
            <h1 style={{fontSize: '3.5rem', color: '#E50914', fontWeight: '900'}}>{countdown > 0 ? countdown : "GO!"}</h1>
            {countdown === 0 && <button style={styles.playBtn} onClick={() => setView('game')}>START GAME</button>}
          </div>
        )}

        {view === 'game' && allRounds[roundIndex] && (
          <div style={styles.gameCard}>
            <audio autoPlay src={allRounds[roundIndex].preview} />
            <div style={styles.progressBar}><div style={{...styles.progressFill, width: `${(roundIndex + 1) * 10}%`}}></div></div>
            <div style={styles.choicesGrid}>
              {allRounds[roundIndex].choices.map(c => (
                <button key={c.id} style={styles.choiceBtn} onClick={() => handleAnswer(c.id === allRounds[roundIndex].correctId)}>{c.title}</button>
              ))}
            </div>
          </div>
        )}

        {view === 'results' && (
          <div style={styles.glassCardResults}>
             <p style={{letterSpacing: '3px', fontSize: '0.7rem', opacity: 0.5}}>ANALYZING PERFORMANCE...</p>
             <button style={{...styles.playBtn, background: '#1da1f2', marginTop: '30px'}} onClick={() => setView('share')}>REVEAL SCORE →</button>
          </div>
        )}

        {view === 'share' && (
          <div style={{textAlign: 'center'}}>
            <div style={styles.shareCard}>
              <div style={{color: '#E50914', fontWeight: 'bold', marginBottom: '20px'}}>VECTFLIX RESULT</div>
              <img src={selectedArtistImg} style={{width: '120px', height: '120px', borderRadius: '50%', border: '4px solid #E50914'}} alt="artist" />
              <h2 style={{marginTop: '15px'}}>{selectedArtist}</h2>
              <div style={{fontSize: '6rem', fontWeight: '900', color: '#E50914'}}>{score}/10</div>
            </div>
            <button style={{...styles.playBtn, background: '#FFD700', color: '#000', marginTop: '20px'}} onClick={() => { setView('ranking'); fetchLeaderboard(); }}>SEE GLOBAL RANKING</button>
          </div>
        )}

        {view === 'ranking' && (
          <div style={styles.glassCardResults}>
            <h2 style={{color: '#E50914', marginBottom: '20px'}}>GLOBAL HALL OF FAME</h2>
            <div style={{textAlign: 'left', marginBottom: '30px'}}>
              {leaderboard.map((r, i) => (
                <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                  <span><span style={{color: i<3?'#E50914':'#555', marginRight: '10px'}}>{i+1}</span> {r.name}</span>
                  <span style={{fontWeight: 'bold'}}>{r.score}/10</span>
                </div>
              ))}
            </div>
            <button style={styles.playBtn} onClick={handleHomeReturn}>PLAY AGAIN</button>
          </div>
        )}

        {/* PEAK MODAL SYSTEM */}
        {activeModal && (
          <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
            <div style={{...styles.glassCardResults, maxWidth:'700px', textAlign:'left'}}>
               <h2 style={{color:'#E50914'}}>{activeModal.toUpperCase()}</h2>
               <p style={{lineHeight:'1.6', opacity:0.8}}>{LEGAL_TEXT[activeModal] || "Vectflix Terms of Service apply."}</p>
               <button style={styles.playBtn} onClick={() => setActiveModal(null)}>CLOSE</button>
            </div>
          </div>
        )}

        <footer style={styles.footer}>
          <div style={{marginBottom: '15px'}}>
            <span onClick={() => setActiveModal('about')} style={styles.instaLink}>About</span>
            <span onClick={() => setActiveModal('privacy')} style={styles.instaLink}>Privacy</span>
            <span onClick={() => setActiveModal('cookies')} style={styles.instaLink}>Cookies</span>
          </div>
          <p style={{fontSize: '0.7rem', opacity: 0.3}}>© 2025 VECTFLIX PEAK ENGINE.</p>
        </footer>
      </div>
    </div>
  );
}
