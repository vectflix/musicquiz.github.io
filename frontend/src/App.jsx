import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://music-guessing-api-v3.onrender.com";
const APPLE_TOKEN = "YOUR_TOKEN_HERE";

const LEGAL_TEXT = { 
  about: "VECTFLIX is a premium, high-speed music recognition platform engineered by @vecteezy_1 for a global community of audiophiles. Our mission is to provide a seamless, low-latency environment where users can test their musical knowledge against a massive global database in real-time. By leveraging the VECTFLIX Peak Audio Engine, we deliver high-fidelity track previews and instant scoring, bridging the gap between casual listening and competitive gaming through a sleek, minimalist interface.",
  cookies: "Cookies Policy: VECTFLIX utilizes essential cookies and local storage technologies to ensure the platform operates at peak performance. These cookies are used to cache game states, preserve your high scores, and optimize audio buffering speeds. Additionally, we integrate Google AdSense, which may utilize non-personalized cookies to serve relevant advertisements. These ads allow us to keep the VECTFLIX engine free for all users. By continuing to use the platform, you consent to these high-speed data caching technologies."
};

const AdSlot = ({ id }) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    }
  }, []);
  return (
    <div style={styles.adSlot}>
      <p style={{fontSize:'0.6rem', color:'#444', marginBottom:'8px'}}>ADVERTISEMENT</p>
      <div style={styles.adPlaceholder}>
        <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-6249624506404198" data-ad-slot={id} data-ad-format="auto" data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [artists, setArtists] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedArtistImg, setSelectedArtistImg] = useState('');
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tempName, setTempName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [isFetchingArtists, setIsFetchingArtists] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('vectflix_user');
    const savedArtist = sessionStorage.getItem('v_name');
    const savedImg = sessionStorage.getItem('v_img');
    if (savedUser) { setUsername(savedUser); setIsLoggedIn(true); }
    if (savedArtist) setSelectedArtist(savedArtist);
    if (savedImg) setSelectedArtistImg(savedImg);
  }, []);

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
    const delay = setTimeout(() => {
      if (searchTerm.trim().length > 1) searchGlobalArtists(searchTerm);
      else if (searchTerm.trim().length === 0) fetchTopArtists();
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  const fetchTopArtists = async () => {
    setIsFetchingArtists(true);
    try {
      const res = await axios.get(`${API_URL}/api/artists`);
      setArtists(res.data.filter(a => a.name && a.picture_medium));
    } catch (e) { console.error("Server warming up..."); }
    setIsFetchingArtists(false);
  };

  const searchGlobalArtists = async (query) => {
    setIsFetchingArtists(true);
    try {
      const res = await axios.get(`${API_URL}/api/search/artists?q=${encodeURIComponent(query)}`);
      setArtists(res.data.filter(a => (a.type==='artist'||!a.type) && a.name && a.picture_medium));
    } catch (e) { console.error("Search failed"); }
    setIsFetchingArtists(false);
  };

  const submitScore = async () => {
    if (!username) return;
    try {
      await axios.post(`${API_URL}/api/leaderboard`, { name: username, score });
      fetchLeaderboard();
    } catch (e) { console.error("Score submission failed"); }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/leaderboard`);
      setLeaderboard(res.data);
    } catch (e) { console.error("Failed to fetch leaderboard"); }
  };

  const startGameSetup = async (a) => {
    setIsFetchingArtists(true);
    setSelectedArtist(a.name);
    setSelectedArtistImg(a.picture_medium);
    sessionStorage.setItem('v_name', a.name);
    sessionStorage.setItem('v_img', a.picture_medium);
    try {
      const res = await axios.get(`${API_URL}/api/game/setup/${a.id}`);
      setAllRounds(res.data);
      setScore(0);
      setRoundIndex(0);
      setView('ready');
      setCountdown(5);
    } catch (err) { alert("Artist not available for quiz. Try another!"); }
    setIsFetchingArtists(false);
  };

  const handleAnswer = (wasCorrect) => {
    if (wasCorrect) setScore(score+1);
    if (roundIndex < 9) setRoundIndex(prev => prev + 1);
    else { setView('results'); submitScore(); }
  };

  const handleHomeReturn = () => { setView('home'); setSearchTerm(''); };

  return (
    <div style={{ ...styles.appWrapper, backgroundImage: selectedArtistImg ? `url(${selectedArtistImg})` : 'linear-gradient(180deg,#000,#111)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={{...styles.container, maxWidth:'900px'}}>
        {!isLoggedIn && (
          <div style={styles.loginOverlay}>
            <div style={{...styles.glassCardResults, backdropFilter:'blur(15px)'}}>
              <h2 style={{color:'#E50914', letterSpacing:'4px'}}>VECTFLIX</h2>
              <input style={styles.loginInput} placeholder="Username..." value={tempName} onChange={(e)=>setTempName(e.target.value)} />
              <button style={styles.playBtn} onClick={()=>{
                if(tempName){
                  localStorage.setItem('vectflix_user', tempName);
                  setUsername(tempName);
                  setIsLoggedIn(true);
                }
              }}>ENTER</button>
            </div>
          </div>
        )}

        <header style={styles.header} onClick={handleHomeReturn}>
          <h1 style={styles.logo}>VECTFLIX</h1>
          {isLoggedIn && <div style={styles.userBadge}>👤 {username}</div>}
        </header>

        {view==='home' && (
          <main>
            <h2 style={styles.heroText}>Guess the <span style={{color:'#E50914'}}>Hit</span></h2>
            <div style={{...styles.searchContainer, backdropFilter:'blur(10px)'}}>
              <input type="text" placeholder="Search global artists..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} style={{...styles.searchInput, backdropFilter:'blur(8px)'}}/>
              {isFetchingArtists && <div style={styles.loaderLine}></div>}
            </div>
            <div style={{...styles.artistGrid, gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))'}}>
              {artists.length>0 ? artists.map(a=>(
                <div key={a.id} style={{...styles.artistCard, backdropFilter:'blur(10px)'}} onClick={()=>startGameSetup(a)}>
                  <img src={a.picture_medium} style={styles.artistImg} alt={a.name}/>
                  <p style={styles.artistName}>{a.name}</p>
                </div>
              )) : !isFetchingArtists && <p style={{gridColumn:'1/-1', textAlign:'center', opacity:0.3}}>No artists found.</p>}
            </div>
            <div style={styles.legalSection}>
              <h4 style={styles.legalHeading}>About VECTFLIX</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.about}</p>
              <h4 style={styles.legalHeading}>Privacy & Cookies</h4>
              <p style={styles.legalBody}>{LEGAL_TEXT.cookies}</p>
            </div>
          </main>
        )}

        {view==='results' && (
          <div style={{...styles.glassCardResults, backdropFilter:'blur(15px)'}}>
            <img src={selectedArtistImg} style={styles.resultsArtistImg} alt="artist" />
            <h2>{selectedArtist}</h2>
            <AdSlot id="4888078097" />
            <a href={`https://music.apple.com/search?term=${encodeURIComponent(selectedArtist)}&at=${APPLE_TOKEN}&ct=vectflix_results`} target="_blank" rel="noreferrer" style={styles.linkButtonWhite}>🍎 Apple Music</a>
            <a href={`https://open.spotify.com/search/${encodeURIComponent(selectedArtist)}`} target="_blank" rel="noreferrer" style={styles.linkButtonGreen}>🎧 Spotify</a>
            <button style={{...styles.playBtn, background:'#1da1f2', marginTop:'20px'}} onClick={()=>{ setView('ranking'); fetchLeaderboard(); }}>SEE GLOBAL RANKING →</button>
          </div>
        )}

        {view==='ranking' && (
          <div style={{...styles.glassCardResults, backdropFilter:'blur(15px)'}}>
            <h2 style={{color:'#E50914'}}>GLOBAL RANKINGS</h2>
            <AdSlot id="4888078097" />
            {leaderboard.map((r,i)=>(
              <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'15px 0', borderBottom:'1px solid #222'}}>
                <span>{i+1}. {r.name}</span>
                <span style={{color:'#E50914', fontWeight:'bold'}}>{r.score}/10</span>
              </div>
            ))}
            <button style={styles.playBtn} onClick={handleHomeReturn}>PLAY AGAIN</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight:'100vh', color:'white', fontFamily:'sans-serif', transition:'0.5s' },
  container: { margin:'0 auto', padding:'20px' },
  header: { padding:'20px 0', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' },
  logo: { color:'#E50914', fontSize:'1.5rem', fontWeight:'900', letterSpacing:'2px' },
  userBadge: { background:'#222', padding:'5px 12px', borderRadius:'20px', fontSize:'0.7rem' },
  heroText: { fontSize:'2rem', marginBottom:'20px', fontWeight:'900' },
  searchContainer: { marginBottom:'25px', position:'relative' },
  searchInput: { width:'100%', padding:'18px', background:'#111', border:'1px solid #333', borderRadius:'15px', color:'white', fontSize:'1rem', outline:'none', boxSizing:'border-box' },
  loaderLine: { height:'2px', background:'#E50914', width:'30%', position:'absolute', bottom:'0', borderRadius:'2px' },
  artistGrid: { display:'grid', gap:'10px' },
  artistCard: { textAlign:'center', cursor:'pointer', transition:'0.3s', borderRadius:'20px', padding:'10px', background:'rgba(255,255,255,0.05)' },
  artistImg: { width:'100%', borderRadius:'50%', border:'2px solid #222' },
  artistName: { fontSize:'0.7rem', marginTop:'5px', fontWeight:'bold' },
  glassCardResults: { background:'rgba(0,0,0,0.6)', padding:'40px 20px', borderRadius:'35px', textAlign:'center', border:'1px solid rgba(255,255,255,0.1)' },
  resultsArtistImg: { width:'80px', height:'80px', borderRadius:'50%', marginBottom:'10px', objectFit:'cover' },
  linkButtonWhite: { textDecoration:'none', background:'#fff', color:'#000', padding:'15px', borderRadius:'12px', fontWeight:'bold', display:'block', margin:'10px 0' },
  linkButtonGreen: { textDecoration:'none', background:'#1DB954', color:'#fff', padding:'15px', borderRadius:'12px', fontWeight:'bold', display:'block', margin:'10px 0' },
  playBtn: { width:'100%', padding:'16px', background:'#E50914', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer', marginTop:'10px' },
  adSlot: { margin:'30px 0', textAlign:'center' },
  adPlaceholder: { minHeight:'120px', background:'rgba(255,255,255,0.02)', borderRadius:'20px' },
  loginOverlay: { position:'fixed', inset:0, background:'#000', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  loginInput: { width:'100%', padding:'18px', background:'#222', border:'1px solid #E50914', borderRadius:'10px', color:'white', textAlign:'center', margin:'20px 0' },
  legalSection: { marginTop:'40px', borderTop:'1px solid #222', paddingTop:'20px' },
  legalHeading: { fontSize:'0.7rem', textTransform:'uppercase', color:'#E50914', marginBottom:'5px' },
  legalBody: { fontSize:'0.6rem', marginBottom:'15px', opacity:0.5 },
};
