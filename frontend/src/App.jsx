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
        <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-6249624506404198" data-ad-slot={id} data-ad-format="auto" data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('home'); 
  const [appMode, setAppMode] = useState('game'); // Mode state added
  const [isFetchingArtists, setIsFetchingArtists] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [newsData, setNewsData] = useState([]); // News state added
  const [realNews, setRealNews] = useState([]); // Headlines state added
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [activeVideo, setActiveVideo] = useState(null); // Modal state added
  const [activeLegal, setActiveLegal] = useState(null); // Legal modal state
  
  const [selectedArtist, setSelectedArtist] = useState(sessionStorage.getItem('v_name') || '');
  const [selectedArtistImg, setSelectedArtistImg] = useState(sessionStorage.getItem('v_img') || '');
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  // Fetch News/Videos only when mode changes
  const fetchEverythingNews = async () => {
    try {
      const vRes = await fetch(`${API_URL}/api/trending`);
      const vData = await vRes.json();
      setNewsData(vData);

      const nRes = await fetch(`${API_URL}/api/news`);
      const nData = await nRes.json();
      setRealNews(nData);
    } catch (e) { console.error("Sync failed."); }
  };

  useEffect(() => {
    if (appMode !== 'game') fetchEverythingNews();
  }, [appMode]);

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
    } catch (err) { alert("Selection failed."); }
    setIsFetchingArtists(false);
  }

  const handleAnswer = (wasCorrect) => {
    if (wasCorrect) setScore(prev => prev + 1);
    if (roundIndex < 9) setRoundIndex(prev => prev + 1);
    else setView('results');
  };

  const handleHomeReturn = () => { setView('home'); setAppMode('game'); setActiveVideo(null); setActiveLegal(null); };

  const rankings = [
    { user: "VECTFLIX_KING", score: 10, date: "Today" },
    { user: username || "You", score: score, date: "Just now" },
    { user: "MusicPro", score: 9, date: "Yesterday" }
  ];

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {/* VIDEO MODAL */}
        {activeVideo && (
          <div style={styles.modalOverlay} onClick={() => setActiveVideo(null)}>
            <div style={styles.videoModal} onClick={(e) => e.stopPropagation()}>
              <button style={styles.closeModal} onClick={() => setActiveVideo(null)}>✕</button>
              <div style={styles.videoFrame}>
                <video src={activeVideo.preview} controls autoPlay style={{width: '100%', height: '100%', borderRadius: '15px'}} />
              </div>
              <div style={{padding: '20px'}}>
                <h3 style={{color: '#fff', margin: '0'}}>{activeVideo.title}</h3>
                <p style={{color: '#E50914', fontWeight: 'bold'}}>{activeVideo.artist?.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* LEGAL MODAL */}
        {activeLegal && (
          <div style={styles.modalOverlay} onClick={() => setActiveLegal(null)}>
            <div style={{...styles.glassCardResults, maxWidth: '350px'}}>
              <h3 style={{color: '#E50914'}}>{activeLegal.title}</h3>
              <p style={{fontSize: '0.8rem', lineHeight: '1.5', opacity: 0.8}}>{activeLegal.content}</p>
              <button style={styles.playBtn} onClick={() => setActiveLegal(null)}>CLOSE</button>
            </div>
          </div>
        )}

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
            {/* MODE TOGGLE */}
            <div style={styles.modeToggle}>
              <button style={{...styles.modeBtn, ...(appMode === 'game' ? styles.activeMode : {})}} onClick={() => setAppMode('game')}>🎮 PLAY</button>
              <button style={{...styles.modeBtn, ...(appMode === 'news' ? styles.activeMode : {})}} onClick={() => setAppMode('news')}>📰 NEWS</button>
              <button style={{...styles.modeBtn, ...(appMode === 'video' ? styles.activeMode : {})}} onClick={() => setAppMode('video')}>🎬 VIDEO</button>
            </div>

            {appMode === 'game' && (
              <>
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
              </>
            )}

            {appMode === 'news' && (
              <div>
                <h2 style={styles.heroText}>Live <span style={{color: '#E50914'}}>Headlines</span></h2>
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  {realNews.map((article, i) => (
                    <a key={i} href={article.link} target="_blank" rel="noreferrer" style={{textDecoration: 'none'}}>
                      <div style={{display: 'flex', gap: '15px', background: '#111', padding: '10px', borderRadius: '15px'}}>
                        <img src={article.thumbnail} style={{width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover'}} />
                        <h4 style={{color: '#fff', fontSize: '0.85rem', margin: 0}}>{article.title}</h4>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {appMode === 'video' && (
              <div>
                <h2 style={styles.heroText}>Trending <span style={{color: '#E50914'}}>Feed</span></h2>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                  {newsData.map((vid, i) => (
                    <div key={i} onClick={() => setActiveVideo(vid)} style={{cursor: 'pointer'}}>
                      <div style={{position: 'relative'}}>
                        <img src={vid.album?.cover_big} style={{width: '100%', borderRadius: '15px'}} />
                        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'}}>▶</div>
                      </div>
                      <p style={{fontSize: '0.7rem', fontWeight: 'bold', marginTop: '5px'}}>{vid.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            <div style={styles.countdownBox}>
              <p style={{fontSize: '0.7rem', opacity: 0.5}}>READYING TRACKS...</p>
              <h1 style={{fontSize: '3.5rem', color: '#E50914', margin: 0, fontWeight: '900'}}>{countdown}</h1>
            </div>
          </div>
        )}

        {view === 'game' && allRounds[roundIndex] && (
          <div style={styles.gameCard}>
            <audio autoPlay src={allRounds[roundIndex].preview} />
            <div style={styles.progressBar}><div style={{...styles.progressFill, width: `${(roundIndex + 1) * 10}%`}}></div></div>
            <p style={{opacity: 0.5, marginBottom: '20px'}}>ROUND {roundIndex + 1}/10</p>
            <div style={styles.choicesGrid}>
              {allRounds[roundIndex].choices.map(c => (
                <button key={c.id} style={styles.choiceBtn} onClick={() => handleAnswer(c.id === allRounds[roundIndex].correctId)}>{c.title}</button>
              ))}
            </div>
          </div>
        )}

        {view === 'results' && (
          <div style={styles.glassCardResults}>
            <p style={{letterSpacing: '3px', fontSize: '0.7rem', opacity: 0.5}}>GAME ANALYZED</p>
            <div style={{marginTop: '20px', padding: '25px', background: 'rgba(255,255,255,0.03)', borderRadius: '25px', border: '1px solid #222'}}>
              <h3 style={{fontSize: '0.9rem', color: '#E50914', marginBottom: '20px'}}>LISTEN TO {selectedArtist.toUpperCase()}</h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <a href={`https://music.apple.com/search?term=${encodeURIComponent(selectedArtist)}`} target="_blank" rel="noreferrer" style={styles.linkButtonWhite}>🍎 Apple Music</a>
                <a href={`https://open.spotify.com/search/${encodeURIComponent(selectedArtist)}`} target="_blank" rel="noreferrer" style={styles.linkButtonGreen}>🎧 Spotify</a>
              </div>
            </div>
            <button style={{...styles.playBtn, background: '#1da1f2', marginTop: '30px'}} onClick={() => setView('share')}>REVEAL SCORE →</button>
          </div>
        )}

        {view === 'share' && (
          <div style={{textAlign: 'center'}}>
            <div style={styles.shareCard}>
              <div style={{color: '#E50914', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '6px', marginBottom: '35px'}}>VECTFLIX</div>
              <img src={selectedArtistImg} style={{width: '130px', height: '130px', borderRadius: '50%', border: '5px solid #E50914', objectFit: 'cover', marginBottom: '20px'}} alt="artist" />
              <div style={{fontSize: '7rem', fontWeight: '900', color: '#E50914', margin: '15px 0'}}>{score}/10</div>
            </div>
            <button style={{...styles.playBtn, background: '#FFD700', color: '#000', marginTop: '20px'}} onClick={() => setView('ranking')}>SEE GLOBAL RANKING</button>
          </div>
        )}

        {view === 'ranking' && (
          <div style={styles.glassCardResults}>
            <h2 style={{color: '#E50914', marginBottom: '20px'}}>GLOBAL RANKINGS</h2>
            <div style={{textAlign: 'left', marginBottom: '30px'}}>
              {rankings.map((r, i) => (
                <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #222'}}>
                  <span>{i+1}. {r.user}</span>
                  <span style={{color: '#E50914', fontWeight: 'bold'}}>{r.score}/10</span>
                </div>
              ))}
            </div>
            <button style={styles.playBtn} onClick={handleHomeReturn}>HOME</button>
          </div>
        )}

        <footer style={styles.footer}>
          <span style={styles.instaLink} onClick={() => setActiveLegal({title: 'About', content: LEGAL_TEXT.about})}>About</span> | 
          <span style={styles.instaLink} onClick={() => setActiveLegal({title: 'Privacy', content: LEGAL_TEXT.privacy})}>Privacy</span> | 
          <span style={styles.instaLink} onClick={() => setActiveLegal({title: 'Terms', content: "Terms of Service under development."})}>Terms</span> | 
          <span style={styles.instaLink} onClick={() => setActiveLegal({title: 'Affiliate', content: "Affiliate disclosures apply to Apple/Spotify links."})}>Affiliate</span>
        </footer>
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
  searchInput: { width: '100%', padding: '18px', background: '#111', border: '1px solid #333', borderRadius: '15px', color: 'white', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' },
  loaderLine: { height: '2px', background: '#E50914', width: '30%', position: 'absolute', bottom: '0', borderRadius: '2px' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  artistCard: { textAlign: 'center', cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '50%', border: '2px solid #222' },
  artistName: { fontSize: '0.7rem', marginTop: '5px', fontWeight: 'bold' },
  gameCard: { background: '#111', padding: '40px 20px', borderRadius: '30px', textAlign: 'center' },
  progressBar: { width: '100%', height: '4px', background: '#222', borderRadius: '2px', marginBottom: '10px' },
  progressFill: { height: '100%', background: '#E50914', transition: '0.4s' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '15px', background: '#222', color: 'white', border: 'none', borderRadius: '12px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer' },
  glassCardResults: { background: '#111', padding: '40px 20px', borderRadius: '35px', textAlign: 'center' },
  linkButtonWhite: { textDecoration:'none', background:'#fff', color:'#000', padding:'15px', borderRadius:'12px', fontWeight:'bold', display: 'block' },
  linkButtonGreen: { textDecoration:'none', background:'#1DB954', color:'#fff', padding:'15px', borderRadius:'12px', fontWeight:'bold', display: 'block' },
  resultsArtistImg: { width: '80px', height: '80px', borderRadius: '50%', marginBottom: '10px', objectFit: 'cover' },
  playBtn: { width: '100%', padding: '16px', background: '#E50914', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' },
  shareCard: { background: '#0a0a0a', padding: '60px 20px', borderRadius: '45px', border: '4px solid #E50914', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  modeToggle: { display: 'flex', gap: '10px', marginBottom: '30px' },
  modeBtn: { flex: 1, padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
  activeMode: { background: '#E50914', border: '1px solid #E50914' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  videoModal: { width: '100%', maxWidth: '500px', background: '#111', borderRadius: '20px', overflow: 'hidden', position: 'relative' },
  closeModal: { position: 'absolute', top: '10px', right: '10px', background: '#000', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', zIndex: 10 },
  videoFrame: { width: '100%', aspectRatio: '16/9', background: '#000' },
  loginOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginInput: { width: '100%', padding: '18px', background: '#222', border: '1px solid #E50914', borderRadius: '10px', color: 'white', textAlign: 'center', margin: '20px 0' },
  footer: { textAlign: 'center', marginTop: '40px', paddingBottom: '20px' },
  instaLink: { color: '#444', textDecoration: 'none', fontSize: '0.8rem', margin: '0 5px', cursor: 'pointer' },
  legalSection: { marginTop: '40px', borderTop: '1px solid #222', paddingTop: '20px' },
  legalHeading: { fontSize: '0.7rem', textTransform: 'uppercase', color: '#E50914', marginBottom: '5px' },
  legalBody: { fontSize: '0.6rem', marginBottom: '15px', opacity: 0.5 },
  countdownBox: { padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '25px', border: '2px solid #E50914' }
};
