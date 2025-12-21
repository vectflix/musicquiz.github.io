import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const API_URL = "https://music-guessing-api-v3.onrender.com"; 

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
  
  const [selectedArtist, setSelectedArtist] = useState(sessionStorage.getItem('v_name') || '');
  const [selectedArtistImg, setSelectedArtistImg] = useState(sessionStorage.getItem('v_img') || '');
  
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  // --- ROTATING ARTISTS ---
  const [artistWindowIndex, setArtistWindowIndex] = useState(0);
  const ARTISTS_PER_VIEW = 6;

  // Smooth fade effect
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (artists.length > 0) {
        setFade(false);
        setTimeout(() => {
          setArtistWindowIndex(prev => (prev + ARTISTS_PER_VIEW) % artists.length);
          setFade(true);
        }, 500); // fade-out duration
      }
    }, 5000); // Change every 5 seconds
    return () => clearInterval(interval);
  }, [artists]);

  // --- 🚀 PRELOAD NEXT 3 ROUNDS ---
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

  // --- ⏱️ MANDATORY 5s COUNTDOWN ---
  useEffect(() => {
    let timer;
    if (view === 'ready' && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [view, countdown]);

  // --- 🌍 UPDATED GLOBAL ARTIST SEARCH LOGIC ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        searchGlobalArtists(searchTerm);
      } else if (searchTerm.trim().length === 0) {
        fetchTopArtists();
      }
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
      const filteredArtists = data.filter(item => 
        (item.type === 'artist' || !item.type) && item.name && item.picture_medium
      );
      setArtists(filteredArtists);
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
      if(data.error) throw new Error(data.error);
      setAllRounds(data);
      setScore(0);
      setRoundIndex(0);
      setView('ready');
      setCountdown(5); 
    } catch (err) { alert("Artist not available for quiz. Try another!"); }
    setIsFetchingArtists(false);
  }

  const handleAnswer = (wasCorrect) => {
    const newScore = wasCorrect ? score + 1 : score;
    if (wasCorrect) setScore(newScore);
    if (roundIndex < 9) {
      setRoundIndex(prev => prev + 1);
    } else {
      setView('results');
    }
  };

  const handleHomeReturn = () => {
    setView('home');
    setSearchTerm('');
  };

  const rankings = [
    { user: "VECTFLIX_KING", score: 10, date: "Today" },
    { user: username || "You", score: score, date: "Just now" },
    { user: "MusicPro", score: 9, date: "Yesterday" }
  ];

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
            <h2 style={styles.heroText}>Guess the <span style={{color:'#E50914'}}>Hit</span></h2>
            
            <div style={styles.searchContainer}>
              <input 
                type="text" 
                placeholder="Search global artists (e.g. Drake)..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={styles.searchInput} 
              />
              {isFetchingArtists && <div style={styles.loaderLine}></div>}
            </div>

            {/* --- Animated Artist Grid --- */}
            <div style={{...styles.artistGrid, opacity: fade ? 1 : 0, transition: 'opacity 0.5s'}}>
              {artists.length > 0 ? 
                artists
                  .slice(artistWindowIndex, artistWindowIndex + ARTISTS_PER_VIEW)
                  .map(a => (
                    <div key={a.id} style={styles.artistCard} onClick={() => startGameSetup(a)}>
                      <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                      <p style={styles.artistName}>{a.name}</p>
                    </div>
                  ))
              : !isFetchingArtists && <p style={{gridColumn: '1/-1', textAlign: 'center', opacity: 0.3}}>No artists found.</p>
              }
            </div>

            <div style={styles.legalSection}>
              <h4 style={styles.legalHeading}>About VECTFLIX</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.about}</p>
              <h4 style={styles.legalHeading}>Privacy & Cookies</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.cookies}</p>
            </div>
          </main>
        )}

        {/* Game, Results, Share, Ranking, Footer remain exactly the same */}
      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', background: '#000', color: 'white', fontFamily: 'sans-serif' },
  container: { maxWidth: '400px', margin: '0 auto', padding: '20px' },
  header: { padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
  logo: { color: '#E50914', fontSize: '1.5rem', fontWeight: '900', letterSpacing: '2px' },
  userBadge: { background: '#222', padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem' },
  heroText: { fontSize: '2rem', marginBottom: '20px', fontWeight: '900' },
  searchContainer: { marginBottom: '25px', position: 'relative' },
  searchInput: { width: '100%', padding: '18px', background: '#111', border: '1px solid #333', borderRadius: '15px', color: 'white', fontSize: '1rem', outline: 'none' },
  loaderLine: { position: 'absolute', bottom: '0', left: '0', height: '2px', width: '100%', background: '#E50914', animation: 'loader 1s infinite' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '30px' },
  artistCard: { cursor: 'pointer', textAlign: 'center', transition: 'transform 0.3s, box-shadow 0.3s', borderRadius: '15px', overflow: 'hidden', border: '1px solid #222', background: 'rgba(255,255,255,0.02)', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' },
  artistCardHover: { transform: 'scale(1.05)', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' },
  artistImg: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '15px' },
  artistName: { fontSize: '0.7rem', margin: '5px 0', fontWeight: '600' },
  legalSection: { marginTop: '30px', fontSize: '0.6rem', lineHeight: '1.4rem', opacity: 0.7 },
  legalHeading: { fontWeight: '700', marginBottom: '5px' },
  legalBody: { marginBottom: '15px' },
  loginOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  glassCardResults: { background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '25px', border: '1px solid #222', textAlign: 'center', color: '#fff' },
  loginInput: { width: '70%', padding: '12px', borderRadius: '15px', border: 'none', marginBottom: '15px', outline: 'none', fontSize: '0.9rem' },
  playBtn: { padding: '12px 25px', background: '#E50914', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' },
  adSlot: { margin: '20px 0', textAlign: 'center' },
  adPlaceholder: { width: '100%', minHeight: '60px' }
};
