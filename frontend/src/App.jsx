import React, { useState, useEffect } from 'react';
import styles from './AppStyles'; 

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
  const [appMode, setAppMode] = useState('game'); 
  const [isFetchingArtists, setIsFetchingArtists] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [newsData, setNewsData] = useState([]); 
  const [realNews, setRealNews] = useState([]); 
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null); 
  
  const [selectedArtist, setSelectedArtist] = useState(sessionStorage.getItem('v_name') || '');
  const [selectedArtistImg, setSelectedArtistImg] = useState(sessionStorage.getItem('v_img') || '');
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  // UPDATED: Fetches News and Videos from your Render Proxy
  const fetchEverythingNews = async () => {
    try {
      const vRes = await fetch(`${API_URL}/api/trending`);
      const vData = await vRes.json();
      setNewsData(vData);

      const nRes = await fetch(`${API_URL}/api/news`);
      const nData = await nRes.json();
      setRealNews(nData);
    } catch (e) { console.error("News/Trending sync failed."); }
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
    else { setView('results'); submitScore(); }
  };

  const handleHomeReturn = () => { setView('home'); setSearchTerm(''); setAppMode('game'); setActiveVideo(null); };

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
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
              <button style={{...styles.modeBtn, ...(appMode === 'game' ? styles.activeMode : {})}} onClick={() => setAppMode('game')}>🎮 PLAY</button>
              <button style={{...styles.modeBtn, ...(appMode === 'news' ? styles.activeMode : {})}} onClick={() => setAppMode('news')}>📰 NEWS</button>
              <button style={{...styles.modeBtn, ...(appMode === 'video' ? styles.activeMode : {})}} onClick={() => setAppMode('video')}>🎬 VIDEO</button>
            </div>

            {appMode === 'news' && (
              <div style={{paddingBottom: '40px'}}>
                <h2 style={styles.heroText}>Live <span style={{color: '#E50914'}}>Headlines</span></h2>
                <div style={styles.newsGrid}>
                  {realNews.map((article, i) => (
                    <a key={i} href={article.link} target="_blank" rel="noreferrer" style={{textDecoration: 'none'}}>
                      <div style={styles.newsCard}>
                        <img src={article.thumbnail || "https://images.unsplash.com/photo-1514525253361-bee8a18744ad?w=400"} style={styles.newsImg} alt="news" />
                        <div style={styles.newsInfo}>
                          <h4 style={{margin: '5px 0', color: '#fff', fontSize: '0.9rem'}}>{article.title}</h4>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {appMode === 'video' && (
              <div style={{paddingBottom: '40px'}}>
                <h2 style={styles.heroText}>Trending <span style={{color: '#E50914'}}>Feed</span></h2>
                <div style={styles.videoGrid}>
                   {newsData.map((vid, i) => (
                     <div key={i} style={styles.videoCard} onClick={() => setActiveVideo(vid)}>
                       <div style={styles.videoWrapper}>
                         <img src={vid.album?.cover_big || vid.cover_big} style={styles.videoThumb} alt="video" />
                         <div style={styles.playOverlay}>▶</div>
                       </div>
                       <h4 style={{marginTop: '10px'}}>{vid.title}</h4>
                       <p style={{fontSize: '0.8rem', opacity: 0.5}}>{vid.artist?.name}</p>
                     </div>
                   ))}
                </div>
              </div>
            )}

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

        {view === 'ready' && (
          <div style={styles.glassCardResults}>
            <img src={selectedArtistImg} style={styles.resultsArtistImg} alt="artist" />
            <h2 style={{margin: '10px 0'}}>{selectedArtist}</h2>
            {countdown > 0 ? (
              <div style={styles.countdownBox}>
                <p style={{fontSize: '0.7rem', opacity: 0.5}}>READYING TRACKS...</p>
                <h1 style={{fontSize: '3.5rem', color: '#E50914', fontWeight: '900'}}>{countdown}</h1>
              </div>
            ) : (
              <button style={styles.playBtn} onClick={() => setView('game')}>START GAME</button>
            )}
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
             <button style={{...styles.playBtn, background: '#1da1f2', marginTop: '30px'}} onClick={() => setView('share')}>REVEAL SCORE →</button>
          </div>
        )}

        {view === 'share' && (
          <div style={{textAlign: 'center'}}>
            <div style={styles.shareCard}>
              <div style={{color: '#E50914', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '6px', marginBottom: '35px'}}>VECTFLIX</div>
              <img src={selectedArtistImg} style={{width: '130px', height: '130px', borderRadius: '50%', border: '5px solid #E50914', objectFit: 'cover'}} />
              <div style={{fontSize: '7rem', fontWeight: '900', color: '#E50914', margin: '15px 0'}}>{score}/10</div>
            </div>
            <button style={{...styles.playBtn, background: '#FFD700', color: '#000', marginTop: '20px'}} onClick={() => { setView('ranking'); fetchLeaderboard(); }}>GLOBAL RANKING</button>
          </div>
        )}

        {view === 'ranking' && (
          <div style={styles.glassCardResults}>
            <h2 style={{color: '#E50914', marginBottom: '20px'}}>GLOBAL RANKINGS</h2>
            <div style={{textAlign: 'left', marginBottom: '30px'}}>
              {leaderboard.map((r, i) => (
                <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #222'}}>
                  <span>{i+1}. {r.name}</span>
                  <span style={{color: '#E50914', fontWeight: 'bold'}}>{r.score}/10</span>
                </div>
              ))}
            </div>
            <button style={styles.playBtn} onClick={handleHomeReturn}>HOME</button>
          </div>
        )}

        <footer style={styles.footer}>
          <a href="#" style={styles.instaLink}>About</a> | 
          <a href="#" style={styles.instaLink}>Privacy</a> | 
          <a href="#" style={styles.instaLink}>Terms</a> | 
          <a href="#" style={styles.instaLink}>Affiliate</a>
        </footer>
      </div>
    </div>
  );
}
