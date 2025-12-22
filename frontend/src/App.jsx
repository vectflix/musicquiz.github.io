import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const API_URL = "https://music-guessing-api-v3.onrender.com"; 
const APPLE_TOKEN = "YOUR_TOKEN_HERE"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium, high-speed music recognition platform engineered by @vecteezy_1 for a global community of audiophiles. Our mission is to provide a seamless, low-latency environment where users can test their musical knowledge against a massive global database in real-time. By leveraging the VECTFLIX Peak Audio Engine, we deliver high-fidelity track previews and instant scoring, bridging the gap between casual listening and competitive gaming through a sleek, minimalist interface.",
  howToPlay: "To begin your experience, search for any global artist using the integrated search bar. Once an artist is selected, our engine will optimize the audio catalog during a mandatory 5-second buffer to ensure lag-free play. You will face 10 high-intensity rounds where you must identify the correct track title from the audio clip provided. Every correct guess increases your standing. After the final round, you can finalize your score and see where you rank on the Global Hall of Fame.",
  privacy: "Privacy Policy: Privacy is a core pillar of the VECTFLIX experience. We prioritize user integrity by operating on a (no-data-collection) model. We do not require emails, passwords, or personal identifiers. Your chosen nickname is stored locally on your device to maintain your session, and competitive scores are transmitted via secure, encrypted protocols to our Render-hosted API solely for leaderboard placement. We never sell, track, or share your personal activity with third parties.",
  cookies: "Cookies Policy: VECTFLIX utilizes essential cookies and local storage technologies to ensure the platform operates at peak performance. These cookies are used to cache game states, preserve your high scores, and optimize audio buffering speeds. Additionally, we integrate Google AdSense, which may utilize non-personalized cookies to serve relevant advertisements. These ads allow us to keep the VECTFLIX engine free for all users. By continuing to use the platform, you consent to these high-speed data caching technologies."
};

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
  const [isFetchingArtists, setIsFetchingArtists] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [rankings, setRankings] = useState([]);
  
  const [selectedArtist, setSelectedArtist] = useState(sessionStorage.getItem('v_name') || '');
  const [selectedArtistImg, setSelectedArtistImg] = useState(sessionStorage.getItem('v_img') || '');
  
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  // PEAK: Smart Audio Preload
  useEffect(() => {
    if ((view === 'game' || view === 'ready') && allRounds.length > 0) {
      const targetRound = allRounds[roundIndex];
      if (targetRound && targetRound.preview) {
        const audioPreload = new Audio();
        audioPreload.src = targetRound.preview;
        audioPreload.preload = "auto";
      }
    }
  }, [view, roundIndex, allRounds]);

  // PEAK: AdSense-friendly Rank Fetching
  const fetchRankings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/rankings`);
      const data = await res.json();
      setRankings(data);
    } catch (e) { console.error("Ranking fetch failed"); }
  };

  const submitScore = async (finalScore) => {
    if (!username) return;
    try {
      await fetch(`${API_URL}/api/rankings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: username, score: finalScore })
      });
    } catch (e) { console.error("Score submission failed"); }
  };

  // PEAK: Debounced Search Logic
  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const delay = setTimeout(() => searchGlobalArtists(searchTerm), 500);
      return () => clearTimeout(delay);
    }
  }, [searchTerm]);

  const searchGlobalArtists = async (query) => {
    setIsFetchingArtists(true);
    try {
      const res = await fetch(`${API_URL}/api/search/artists?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setArtists(data.filter(item => item.name && item.picture_medium));
    } catch (e) { console.error("Search failed"); }
    setIsFetchingArtists(false);
  };

  const startGameSetup = async (a) => {
    setIsFetchingArtists(true);
    setSelectedArtist(a.name);
    setSelectedArtistImg(a.picture_medium);
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
    } catch (err) { alert("Artist catalog unavailable. Try another!"); }
    setIsFetchingArtists(false);
  }

  const handleAnswer = (wasCorrect) => {
    const newScore = wasCorrect ? score + 1 : score;
    if (wasCorrect) setScore(newScore);
    if (roundIndex < 9) {
      setRoundIndex(prev => prev + 1);
    } else {
      setView('results');
      submitScore(newScore);
    }
  };

  const handleHomeReturn = () => {
    setView('home');
    setSearchTerm('');
  };

  useEffect(() => {
    if (view === 'ranking') fetchRankings();
  }, [view]);

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {!isLoggedIn && (
          <div style={styles.loginOverlay}>
            <div style={styles.glassCardResults}>
              <h2 style={{color: '#E50914', letterSpacing: '4px'}}>VECTFLIX</h2>
              <input style={styles.loginInput} placeholder="Create Nickname..." value={tempName} onChange={(e) => setTempName(e.target.value)} />
              <button style={styles.playBtn} onClick={() => {if(tempName){localStorage.setItem('vectflix_user', tempName); setUsername(tempName); setIsLoggedIn(true);}}}>ACCESS ENGINE</button>
            </div>
          </div>
        )}

        <header style={styles.header} onClick={handleHomeReturn}>
          <h1 style={styles.logo}>VECTFLIX</h1>
          {isLoggedIn && <div style={styles.userBadge}>👤 {username}</div>}
        </header>

        {view === 'home' && (
          <main>
            <h2 style={styles.heroText}>Guess the <span style={{color:'#E50914'}}>Hit</span></h2>
            <div style={styles.searchContainer}>
              <input type="text" placeholder="Search artists..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
              {isFetchingArtists && <div style={styles.loaderLine}></div>}
            </div>
            <div style={styles.artistGrid}>
              {artists.map(a => (
                <div key={a.id} style={styles.artistCard} onClick={() => startGameSetup(a)}>
                  <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                  <p style={styles.artistName}>{a.name}</p>
                </div>
              ))}
            </div>
            <div style={styles.legalSection}>
              <h4 style={styles.legalHeading}>Engine Specs</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.about}</p>
              <h4 style={styles.legalHeading}>Privacy Protocol</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.cookies}</p>
            </div>
          </main>
        )}

        {view === 'ready' && (
          <div style={styles.glassCardResults}>
            <img src={selectedArtistImg} style={styles.resultsArtistImg} alt="artist" />
            <h2 style={{margin: '10px 0'}}>{selectedArtist}</h2>
            {countdown > 0 ? (
              <div style={styles.countdownBox}>
                <p style={{fontSize: '0.6rem', opacity: 0.5}}>BUFFERING PEAK AUDIO...</p>
                <h1 style={{fontSize: '3.5rem', color: '#E50914', margin: 0}}>{countdown}</h1>
              </div>
            ) : (
              <button style={styles.playBtn} onClick={() => setView('game')}>INITIALIZE GAME</button>
            )}
          </div>
        )}

        {view === 'game' && allRounds[roundIndex] && (
          <div style={styles.gameCard}>
            <audio autoPlay src={allRounds[roundIndex].preview} onError={() => handleAnswer(false)} />
            <div style={styles.progressBar}><div style={{...styles.progressFill, width: `${(roundIndex + 1) * 10}%`}}></div></div>
            <p style={{fontSize: '0.7rem', opacity: 0.5}}>ROUND {roundIndex + 1}/10</p>
            <div style={styles.choicesGrid}>
              {allRounds[roundIndex].choices.map(c => (
                <button key={c.id} style={styles.choiceBtn} onClick={() => handleAnswer(c.id === allRounds[roundIndex].correctId)}>{c.title}</button>
              ))}
            </div>
          </div>
        )}

        {view === 'results' && (
          <div style={styles.glassCardResults}>
            <div style={styles.statusDot}></div>
            <p style={{letterSpacing: '3px', fontSize: '0.7rem', opacity: 0.5}}>DATA ANALYZED</p>
            <div style={{marginTop: '20px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '25px', border: '1px solid #222'}}>
              <h3 style={{fontSize: '0.8rem', color: '#E50914', marginBottom: '15px'}}>STREAM {selectedArtist.toUpperCase()}</h3>
              <a href={`https://music.apple.com/search?term=${encodeURIComponent(selectedArtist)}&at=${APPLE_TOKEN}&ct=vectflix`} target="_blank" rel="noreferrer" style={styles.linkButtonWhite}>🍎 Apple Music</a>
            </div>
            <button style={{...styles.playBtn, marginTop: '30px'}} onClick={() => setView('share')}>REVEAL STANDING →</button>
          </div>
        )}

        {view === 'share' && (
          <div style={{textAlign: 'center'}}>
            <div style={styles.shareCard}>
              <div style={{color: '#E50914', fontSize: '0.7rem', letterSpacing: '4px', marginBottom: '20px'}}>VECTFLIX</div>
              <img src={selectedArtistImg} style={{width: '120px', borderRadius: '50%', border: '4px solid #E50914'}} alt="artist" />
              <h2>{selectedArtist} <span style={{color: '#1da1f2'}}>✓</span></h2>
              <div style={{fontSize: '6rem', fontWeight: '900', color: '#E50914'}}>{score}/10</div>
            </div>
            <button style={{...styles.playBtn, background: '#FFD700', color: '#000', marginTop: '20px'}} onClick={() => setView('ranking')}>SEE GLOBAL HALL OF FAME</button>
          </div>
        )}

        {view === 'ranking' && (
          <div style={styles.glassCardResults}>
            <h2 style={{color: '#E50914'}}>HALL OF FAME</h2>
            <AdSlot key="ranking-ad" id="4888078097" /> 
            <div style={{textAlign: 'left', margin: '20px 0'}}>
              {rankings.length > 0 ? rankings.map((r, i) => (
                <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #222'}}>
                  <span>{i+1}. {r.user}</span>
                  <span style={{color: '#E50914', fontWeight: 'bold'}}>{r.score}/10</span>
                </div>
              )) : <p style={{textAlign: 'center', opacity: 0.3}}>Syncing scores...</p>}
            </div>
            <button style={styles.playBtn} onClick={handleHomeReturn}>NEW SESSION</button>
          </div>
        )}

        <footer style={styles.footer}>
          <a href="/about.html" style={styles.instaLink}>About</a> | 
          <a href="/privacy-policy.html" style={styles.instaLink}>Privacy</a> | 
          <a href="/terms.html" style={styles.instaLink}>Terms</a> |
          <a href="/cookies.html" style={styles.instaLink}>Cookies</a>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', background: '#000', color: 'white', fontFamily: '-apple-system, sans-serif' },
  container: { maxWidth: '400px', margin: '0 auto', padding: '20px' },
  header: { padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  logo: { color: '#E50914', fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px' },
  userBadge: { background: '#111', padding: '6px 14px', borderRadius: '20px', fontSize: '0.65rem', border: '1px solid #222' },
  heroText: { fontSize: '2.2rem', marginBottom: '20px', fontWeight: '900' },
  searchContainer: { marginBottom: '25px', position: 'relative' },
  searchInput: { width: '100%', padding: '18px', background: '#0a0a0a', border: '1px solid #222', borderRadius: '15px', color: 'white', outline: 'none', boxSizing: 'border-box' },
  loaderLine: { height: '2px', background: '#E50914', width: '30%', position: 'absolute', bottom: '0', borderRadius: '2px' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  artistCard: { textAlign: 'center', cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '50%', border: '2px solid #111' },
  artistName: { fontSize: '0.65rem', marginTop: '6px', fontWeight: 'bold', opacity: 0.8 },
  gameCard: { background: '#0a0a0a', padding: '40px 20px', borderRadius: '30px', textAlign: 'center', border: '1px solid #111' },
  progressBar: { width: '100%', height: '4px', background: '#222', borderRadius: '2px', marginBottom: '10px' },
  progressFill: { height: '100%', background: '#E50914', borderRadius: '2px' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '16px', background: '#111', color: 'white', border: '1px solid #222', borderRadius: '14px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold' },
  glassCardResults: { background: '#0a0a0a', padding: '40px 20px', borderRadius: '35px', textAlign: 'center', border: '1px solid #111' },
  statusDot: { width: '8px', height: '8px', background: '#E50914', borderRadius: '50%', display: 'inline-block', marginRight: '8px' },
  linkButtonWhite: { textDecoration:'none', background:'#fff', color:'#000', padding:'15px', borderRadius:'12px', fontWeight:'bold', display: 'block', fontSize: '0.9rem' },
  resultsArtistImg: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E50914' },
  playBtn: { width: '100%', padding: '18px', background: '#E50914', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px' },
  shareCard: { background: '#050505', padding: '40px 20px', borderRadius: '45px', border: '3px solid #E50914', textAlign: 'center' },
  adSlot: { margin: '25px 0' },
  adPlaceholder: { minHeight: '120px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed #222' },
  loginOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginInput: { width: '100%', padding: '18px', background: '#0a0a0a', border: '1px solid #E50914', borderRadius: '15px', color: 'white', textAlign: 'center', margin: '20px 0', fontSize: '1rem' },
  footer: { textAlign: 'center', marginTop: '40px', paddingBottom: '30px' },
  instaLink: { color: '#333', textDecoration: 'none', fontSize: '0.75rem', margin: '0 8px' },
  legalSection: { marginTop: '35px', borderTop: '1px solid #111', paddingTop: '20px' },
  legalHeading: { fontSize: '0.65rem', color: '#E50914', marginBottom: '6px', letterSpacing: '1px', fontWeight: 'bold' },
  legalBody: { fontSize: '0.58rem', marginBottom: '18px', opacity: 0.4, lineHeight: '1.4' },
  countdownBox: { padding: '25px', border: '1px solid #E50914', borderRadius: '25px', background: 'rgba(229, 9, 20, 0.03)' }
};
          
