import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- CONFIGURATION ---
const API_URL = "https://music-guessing-api-v3.onrender.com"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium high-speed music guessing game. Using the Deezer API, we provide 30-second song previews to test your knowledge of your favorite artists. Created by @vecteezy_1.",
  privacy: "Privacy Policy: VECTFLIX uses local storage for high scores. We do not store personal identification data.",
  cookies: "Cookies Policy: We use cookies to analyze site traffic and for ads. Third-party partners like Google AdSense use cookies to serve personalized ads based on your visits to this and other websites. You can manage your cookie preferences in your browser settings."
};

// --- 💰 UPDATED AD COMPONENT ---
const AdSlot = () => {
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
             data-ad-slot="default" 
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
  const [highScore, setHighScore] = useState(localStorage.getItem('vectflix_highscore') || 0);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedArtistImg, setSelectedArtistImg] = useState('');
  const [newBest, setNewBest] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- 🚀 NO-LAG ENGINE: 3-ROUND BUFFER ---
  useEffect(() => {
    if ((view === 'game' || view === 'ready') && allRounds.length > 0) {
      [roundIndex, roundIndex + 1, roundIndex + 2].forEach(idx => {
        if (allRounds[idx]) {
          const audio = new Audio();
          audio.src = allRounds[idx].preview;
          audio.preload = "auto";
        }
      });
    }
  }, [roundIndex, view, allRounds]);

  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(data => {
      if(Array.isArray(data)) setArtists(data);
    }).catch(() => console.log("Backend warming up..."));
  }, []);

  const startFullGame = async (artistId, artistName, artistImg) => {
    setLoading(true);
    setSelectedArtist(artistName);
    setSelectedArtistImg(artistImg);
    setNewBest(false);
    try {
      const res = await fetch(`${API_URL}/api/game/setup/${artistId}`);
      const data = await res.json();
      setAllRounds(data);
      setScore(0); 
      setRoundIndex(0); 
      setView('ready'); 
    } catch (err) { alert("Server warming up! Try again."); }
    finally { setLoading(false); }
  };

  const handleAnswer = (wasCorrect) => {
    if (wasCorrect) setScore(s => s + 1);
    if (roundIndex < allRounds.length - 1) {
      setRoundIndex(prev => prev + 1);
    } else {
      const finalScore = wasCorrect ? score + 1 : score;
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('vectflix_highscore', finalScore);
        setNewBest(true);
      }
      setView('results');
    }
  };

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.logo} onClick={() => window.location.reload()}>VECTFLIX</h1>
          <div style={styles.topBadge}>🏆 BEST: {highScore}/10</div>
        </header>

        {view === 'home' && (
          <main>
            <div style={styles.heroSection}>
              <h2 style={styles.heroText}>Guess the <span style={{color:'#E50914'}}>Hit</span></h2>
              <form onSubmit={(e) => { e.preventDefault(); fetch(`${API_URL}/api/search/${searchTerm}`).then(res => res.json()).then(setArtists); }} style={styles.searchBox}>
                <input style={styles.searchBar} placeholder="Search artist..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <button type="submit" style={styles.searchBtn}>🔍</button>
              </form>
            </div>
            
            <h3 style={styles.sectionTitle}>Trending Artists</h3>
            {loading ? <div style={styles.loader}>🎧 PREPARING CLIPS...</div> : (
              <div style={styles.artistGrid}>
                {artists.map(a => (
                  <div key={a.id} style={styles.artistCard} onClick={() => startFullGame(a.id, a.name, a.picture_medium)}>
                    <div style={styles.imgWrapper}>
                      <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                    </div>
                    <p style={styles.artistName}>{a.name}</p>
                  </div>
                ))}
              </div>
            )}
            
            <AdSlot />

            <div style={styles.legalSection}>
              <h4 style={styles.legalHeading}>About VECTFLIX</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.about}</p>
              <h4 style={styles.legalHeading}>Privacy & Cookies</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.privacy}</p>
              <p style={styles.legalBody}>{LEGAL_TEXT.cookies}</p>
            </div>
          </main>
        )}

        {view === 'ready' && (
          <div style={styles.glassCardResults}>
            <img src={selectedArtistImg} style={styles.resultsArtistImg} alt="artist" />
            <h2 style={{margin: '10px 0', fontSize: '1.8rem'}}>{selectedArtist}</h2>
            <p style={{opacity: 0.5, marginBottom: '25px'}}>10 Rounds • Instant Play</p>
            <button style={styles.playBtn} onClick={() => setView('game')}>START GAME</button>
          </div>
        )}

        {view === 'game' && allRounds[roundIndex] && (
          <GameRound key={roundIndex} roundData={allRounds[roundIndex]} roundNum={roundIndex + 1} onAnswer={handleAnswer} />
        )}

        {view === 'results' && (
          <div style={styles.glassCardResults}>
            {newBest && <div style={styles.newBestTag}>NEW RECORD!</div>}
            <img src={selectedArtistImg} style={styles.resultsArtistImg} alt="artist" />
            <h2 style={{margin: '5px 0'}}>{selectedArtist}</h2>
            <div style={styles.scoreBox}>
              <span style={styles.finalScore}>{score}</span>
              <span style={{fontSize: '1.2rem', opacity: 0.4}}>/10</span>
            </div>
            <div style={styles.buttonGroup}>
               <button style={styles.shareBtn} onClick={() => { navigator.clipboard.writeText(`I got ${score}/10 on VECTFLIX!`); setCopied(true); setTimeout(()=>setCopied(false),2000); }}>{copied ? "COPIED!" : "SHARE"}</button>
               <button style={styles.playBtn} onClick={() => window.location.reload()}>RETRY</button>
            </div>
          </div>
        )}

        <footer style={styles.footer}>
          <a href="https://instagram.com/vecteezy_1" style={styles.instaLink}>Created by @vecteezy_1</a>
        </footer>
      </div>
    </div>
  );
}

function GameRound({ roundData, roundNum, onAnswer }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(roundData.preview);
    audio.preload = "auto";
    audioRef.current = audio;
    audio.play().catch(() => {});
    const timer = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { onAnswer(false); return 0; } return p - 1; });
    }, 1000);
    return () => { clearInterval(timer); if(audioRef.current){audioRef.current.pause(); audioRef.current.src="";} };
  }, [roundData]);

  return (
    <div style={styles.gameCard}>
      <div style={styles.gameHeader}>
        <span style={{color: '#E50914'}}>ROUND {roundNum}/10</span>
        <span style={{letterSpacing: '1px'}}>{timeLeft}s</span>
      </div>
      <div style={styles.progressContainer}><div style={{...styles.progressBar, width: `${timeLeft*10}%`}}></div></div>
      <div style={styles.choicesGrid}>
        {roundData.choices.map(c => (
          <button key={c.id} style={styles.choiceBtn} onClick={() => onAnswer(c.id === roundData.correctId)}>{c.title}</button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', background: 'radial-gradient(circle at top, #1a1a1a 0%, #000 100%)', color: 'white', fontFamily: '"Inter", sans-serif' },
  container: { maxWidth: '450px', margin: '0 auto', padding: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  logo: { color: '#E50914', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '2px', cursor: 'pointer' },
  topBadge: { background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' },
  heroSection: { marginBottom: '30px' },
  heroText: { fontSize: '2.5rem', fontWeight: '800', margin: '0 0 15px 0', lineHeight: 1.1 },
  searchBox: { display: 'flex', background: '#222', borderRadius: '15px', padding: '5px 10px', alignItems: 'center' },
  searchBar: { flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '12px', outline: 'none' },
  searchBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' },
  sectionTitle: { fontSize: '1rem', marginBottom: '15px', opacity: 0.6, textTransform: 'uppercase' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' },
  artistCard: { textAlign: 'center', cursor: 'pointer' },
  imgWrapper: { overflow: 'hidden', borderRadius: '50%', aspectRatio: '1/1', border: '2px solid #333' },
  artistImg: { width: '100%', height: '100%', objectFit: 'cover' },
  artistName: { fontSize: '0.7rem', marginTop: '8px', fontWeight: '600' },
  gameCard: { background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' },
  gameHeader: { display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '10px' },
  progressContainer: { background: '#222', height: '4px', borderRadius: '2px', marginBottom: '25px', overflow: 'hidden' },
  progressBar: { height: '100%', background: '#E50914', transition: '1s linear' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  choiceBtn: { padding: '18px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '15px', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem' },
  glassCardResults: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', borderRadius: '35px', padding: '40px 20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' },
  newBestTag: { position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: '#E50914', color: '#fff', padding: '6px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.7rem' },
  resultsArtistImg: { width: '100px', height: '100px', borderRadius: '50%', border: '4px solid #E50914', marginBottom: '15px' },
  scoreBox: { margin: '15px 0' },
  finalScore: { fontSize: '5rem', fontWeight: '900' },
  buttonGroup: { display: 'flex', gap: '10px', marginTop: '30px' },
  playBtn: { flex: 1.5, padding: '16px', background: '#E50914', border: 'none', color: '#fff', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' },
  shareBtn: { flex: 1, padding: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' },
  loader: { textAlign: 'center', color: '#E50914', marginTop: '50px', fontWeight: 'bold' },
  footer: { textAlign: 'center', marginTop: '50px' },
  instaLink: { color: '#444', textDecoration: 'none', fontSize: '0.8rem' },
  adSlot: { margin: '40px 0', textAlign: 'center' },
  adPlaceholder: { minHeight: '100px', background: 'rgba(255,255,255,0.02)', border: '1px dashed #333', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  legalSection: { marginTop: '40px', borderTop: '1px solid #222', paddingTop: '20px', textAlign: 'left' },
  legalHeading: { color: '#E50914', fontSize: '0.8rem', margin: '5px 0' },
  legalBody: { fontSize: '0.6rem', color: '#666', lineHeight: '1.4', marginBottom: '10px' }
};
