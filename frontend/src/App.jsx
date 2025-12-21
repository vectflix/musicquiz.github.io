import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const API_URL = "https://music-guessing-api-v3.onrender.com"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium high-speed music guessing game designed for true audiophiles. Created by @vecteezy_1.",
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
  
  const [selectedArtist, setSelectedArtist] = useState(sessionStorage.getItem('v_name') || '');
  const [selectedArtistImg, setSelectedArtistImg] = useState(sessionStorage.getItem('v_img') || '');
  
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  // Search Logic
  const filteredArtists = artists.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (view === 'results' || view === 'share') {
        const savedName = sessionStorage.getItem('v_name');
        const savedImg = sessionStorage.getItem('v_img');
        if (savedName && !selectedArtist) setSelectedArtist(savedName);
        if (savedImg && !selectedArtistImg) setSelectedArtistImg(savedImg);
    }
  }, [view]);

  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(setArtists);
  }, []);

  const startGameSetup = async (a) => {
    setLoading(true);
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
    } catch (err) { alert("Server warming up!"); }
    setLoading(false);
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

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {/* LOGIN OVERLAY */}
        {!isLoggedIn && (
          <div style={styles.loginOverlay}>
            <div style={styles.glassCardResults}>
              <h2 style={{color: '#E50914'}}>VECTFLIX</h2>
              <input style={styles.loginInput} placeholder="Username..." value={tempName} onChange={(e) => setTempName(e.target.value)} />
              <button style={styles.playBtn} onClick={() => {localStorage.setItem('vectflix_user', tempName); setUsername(tempName); setIsLoggedIn(true);}}>ENTER</button>
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
            
            {/* SEARCH BAR */}
            <div style={styles.searchContainer}>
              <input 
                type="text" 
                placeholder="Search artists..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                style={styles.searchInput}
              />
            </div>

            <div style={styles.artistGrid}>
              {filteredArtists.length > 0 ? (
                filteredArtists.map(a => (
                  <div key={a.id} style={styles.artistCard} onClick={() => startGameSetup(a)}>
                    <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                    <p style={styles.artistName}>{a.name}</p>
                  </div>
                ))
              ) : (
                <p style={{gridColumn: '1/-1', textAlign: 'center', opacity: 0.5, marginTop: '20px'}}>No artists found.</p>
              )}
            </div>

            {/* LEGAL INFO FOOTER */}
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
            <button style={styles.playBtn} onClick={() => setView('game')}>START GAME</button>
          </div>
        )}

        {view === 'game' && allRounds[roundIndex] && (
          <div style={styles.gameCard}>
            <audio autoPlay src={allRounds[roundIndex].preview} />
            <p style={{opacity: 0.5, marginBottom: '20px'}}>ROUND {roundIndex + 1}/10</p>
            <div style={styles.choicesGrid}>
              {allRounds[roundIndex].choices.map(c => (
                <button key={c.id} style={styles.choiceBtn} onClick={() => handleAnswer(c.id === allRounds[roundIndex].correctId)}>{c.title}</button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: DISCOVERY SCREEN */}
        {view === 'results' && (
          <div style={styles.glassCardResults}>
            <div style={{marginBottom: '20px'}}>
                <div style={styles.statusDot}></div>
                <p style={{letterSpacing: '3px', fontSize: '0.7rem', opacity: 0.5, display: 'inline'}}>GAME ANALYZED</p>
            </div>
            <div style={{marginTop: '10px', padding: '25px', background: 'rgba(255,255,255,0.03)', borderRadius: '25px', border: '1px solid #222'}}>
              <h3 style={{fontSize: '0.9rem', color: '#E50914', marginBottom: '20px'}}>LISTEN TO {selectedArtist.toUpperCase()}</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <a href={`https://music.apple.com/search?term=${selectedArtist}`} target="_blank" rel="noreferrer" style={styles.linkButtonWhite}>🍎 Apple Music</a>
                <a href={`https://open.spotify.com/search/${selectedArtist}`} target="_blank" rel="noreferrer" style={styles.linkButtonGreen}>🎧 Spotify</a>
              </div>
            </div>
            <button style={{...styles.playBtn, background: '#1da1f2', marginTop: '30px', fontSize: '1.1rem'}} onClick={() => setView('share')}>
                REVEAL MY SCORE →
            </button>
          </div>
        )}

        {/* STEP 2: FINALE REVEAL CARD */}
        {view === 'share' && (
          <div style={{textAlign: 'center'}}>
            <div style={styles.shareCard}>
              <div style={{color: '#E50914', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '6px', marginBottom: '35px'}}>VECTFLIX</div>
              <img src={selectedArtistImg} style={{width: '130px', height: '130px', borderRadius: '50%', border: '5px solid #E50914', objectFit: 'cover', marginBottom: '20px'}} alt="artist" />
              <div style={{display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'}}>
                <h2 style={{margin: '0', fontSize: '1.8rem', color: '#fff', fontWeight: '900', textTransform: 'uppercase'}}>{selectedArtist}</h2>
                <div style={styles.verifiedBadge}>✓</div>
              </div>
              <p style={{fontSize: '0.7rem', color: '#E50914', fontWeight: 'bold', letterSpacing: '2px', marginTop: '5px'}}>OFFICIAL FAN SCORE</p>
              <div style={{fontSize: '7rem', fontWeight: '900', color: '#E50914', margin: '15px 0', lineHeight: '0.8'}}>{score}/10</div>
              <div style={{opacity: 0.3, fontSize: '0.6rem', marginTop: '25px', borderTop: '1px solid #222', paddingTop: '15px', width: '80%'}}>musicquiz-github-io.vercel.app</div>
            </div>
            <AdSlot id="share_page_ad" />
            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                <button style={{...styles.playBtn, flex: 1, background: '#222'}} onClick={handleHomeReturn}>PLAY AGAIN</button>
                <button style={{...styles.playBtn, flex: 1, background: '#1da1f2'}} onClick={() => {navigator.clipboard.writeText(`I scored ${score}/10 on ${selectedArtist}!`); alert("Score Link Copied!");}}>SHARE</button>
            </div>
          </div>
        )}

        {/* MAIN PERSISTENT FOOTER */}
        <footer style={styles.footer}>
          <a href="https://instagram.com/vecteezy_1" target="_blank" rel="noreferrer" style={styles.instaLink}>Created by @vecteezy_1</a>
        </footer>
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
  heroText: { fontSize: '2rem', marginBottom: '20px' },
  searchContainer: { marginBottom: '25px' },
  searchInput: { width: '100%', padding: '15px', background: '#111', border: '1px solid #222', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  artistCard: { textAlign: 'center', cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '50%', border: '2px solid #222' },
  artistName: { fontSize: '0.7rem', marginTop: '5px' },
  gameCard: { background: '#111', padding: '40px 20px', borderRadius: '30px', textAlign: 'center' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '15px', background: '#222', color: 'white', border: 'none', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold' },
  glassCardResults: { background: '#111', padding: '40px 20px', borderRadius: '35px', textAlign: 'center' },
  statusDot: { width: '8px', height: '8px', background: '#E50914', borderRadius: '50%', display: 'inline-block', marginRight: '8px', boxShadow: '0 0 10px #E50914' },
  linkButtonWhite: { textDecoration:'none', background:'#fff', color:'#000', padding:'15px', borderRadius:'12px', fontWeight:'bold', display: 'block' },
  linkButtonGreen: { textDecoration:'none', background:'#1DB954', color:'#fff', padding:'15px', borderRadius:'12px', fontWeight:'bold', display: 'block' },
  resultsArtistImg: { width: '80px', borderRadius: '50%', marginBottom: '10px' },
  playBtn: { width: '100%', padding: '16px', background: '#E50914', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  shareCard: { background: '#0a0a0a', padding: '60px 20px', borderRadius: '45px', border: '4px solid #E50914', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 20px 60px rgba(229, 9, 20, 0.4)' },
  verifiedBadge: { background: '#1da1f2', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white', fontWeight: 'bold' },
  adSlot: { margin: '30px 0', textAlign: 'center' },
  adPlaceholder: { minHeight: '120px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' },
  loginOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginInput: { width: '100%', padding: '15px', background: '#222', border: 'none', borderRadius: '10px', color: 'white', textAlign: 'center', margin: '20px 0' },
  footer: { textAlign: 'center', marginTop: '40px', paddingBottom: '20px' },
  instaLink: { color: '#444', textDecoration: 'none', fontSize: '0.8rem' },
  legalSection: { marginTop: '40px', borderTop: '1px solid #222', paddingTop: '20px', textAlign: 'left' },
  legalHeading: { fontSize: '0.7rem', textTransform: 'uppercase', color: '#E50914', marginBottom: '5px' },
  legalBody: { fontSize: '0.6rem', marginBottom: '15px', opacity: 0.5, lineHeight: '1.4' }
};
