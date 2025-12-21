import React, { useState, useEffect, useRef } from 'react';

// --- CONFIGURATION ---
const API_URL = "https://music-guessing-api-v3.onrender.com"; 

const LEGAL_TEXT = {
  about: "VECTFLIX is a premium music guessing game by @vecteezy_1.",
  cookies: "We use cookies for analytics and ads via Google AdSense."
};

const AdSlot = ({ id }) => {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, []);
  return (
    <div style={{margin: '20px 0', textAlign: 'center'}}>
      <div style={{minHeight: '100px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px'}}>
        <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-6249624506404198" data-ad-slot={id} data-ad-format="auto" data-full-width-responsive="true"></ins>
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
  const [leaderboard, setLeaderboard] = useState([]);
  
  // DATA PERSISTENCE - Reading directly from storage to prevent "invisible" names
  const [selectedArtist, setSelectedArtist] = useState(localStorage.getItem('peak_artist_name') || '');
  const [selectedArtistImg, setSelectedArtistImg] = useState(localStorage.getItem('peak_artist_img') || '');
  
  const [countdown, setCountdown] = useState(null); 
  const [username, setUsername] = useState(localStorage.getItem('vectflix_user') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('vectflix_user'));
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(setArtists);
  }, []);

  const startGameSetup = async (a) => {
    setLoading(true);
    // HARD SAVE TO DISK IMMEDIATELY
    localStorage.setItem('peak_artist_name', a.name);
    localStorage.setItem('peak_artist_img', a.picture_medium);
    setSelectedArtist(a.name);
    setSelectedArtistImg(a.picture_medium);

    try {
      const res = await fetch(`${API_URL}/api/game/setup/${a.id}`);
      const data = await res.json();
      setAllRounds(data);
      setScore(0);
      setRoundIndex(0);
      setView('ready');
    } catch (err) { alert("Server warming up!"); }
    setLoading(false);
  };

  const handleAnswer = (wasCorrect) => {
    const newScore = wasCorrect ? score + 1 : score;
    if (wasCorrect) setScore(newScore);
    if (roundIndex < 9) {
      setRoundIndex(prev => prev + 1);
    } else {
      setView('results');
      updateLeaderboard(newScore);
    }
  };

  const updateLeaderboard = async (s) => {
    try {
      const res = await fetch(`${API_URL}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username || "Guest", score: s })
      });
      const data = await res.json();
      setLeaderboard(data);
    } catch (e) {}
  };

  return (
    <div style={{minHeight: '100vh', background: '#000', color: 'white', fontFamily: 'sans-serif'}}>
      <div style={{maxWidth: '400px', margin: '0 auto', padding: '20px'}}>
        
        {!isLoggedIn && (
          <div style={{position:'fixed', inset:0, background:'#000', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px'}}>
            <div style={{background:'#111', padding:'30px', borderRadius:'30px', textAlign:'center', width:'100%'}}>
              <h2 style={{color:'#E50914'}}>VECTFLIX</h2>
              <input style={{width:'100%', padding:'15px', background:'#222', border:'none', borderRadius:'10px', color:'#fff', margin:'20px 0', textAlign:'center'}} placeholder="Username..." value={tempName} onChange={e=>setTempName(e.target.value)} />
              <button style={{width:'100%', padding:'15px', background:'#E50914', color:'#fff', border:'none', borderRadius:'10px', fontWeight:'bold'}} onClick={() => {localStorage.setItem('vectflix_user', tempName); setUsername(tempName); setIsLoggedIn(true);}}>ENTER</button>
            </div>
          </div>
        )}

        <header style={{padding:'20px 0', display:'flex', justifyContent:'space-between', alignItems:'center'}} onClick={() => setView('home')}>
          <h1 style={{color:'#E50914', fontSize:'1.5rem', fontWeight:'bold'}}>VECTFLIX</h1>
          {isLoggedIn && <div style={{background:'#222', padding:'5px 12px', borderRadius:'20px', fontSize:'0.7rem'}}>👤 {username}</div>}
        </header>

        {view === 'home' && (
          <main>
            <h2 style={{fontSize:'2rem'}}>Guess the <span style={{color:'#E50914'}}>Hit</span></h2>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginTop:'20px'}}>
              {artists.map(a => (
                <div key={a.id} style={{textAlign:'center'}} onClick={() => startGameSetup(a)}>
                  <img src={a.picture_medium} style={{width:'100%', borderRadius:'50%'}} alt={a.name} />
                  <p style={{fontSize:'0.7rem', marginTop:'5px'}}>{a.name}</p>
                </div>
              ))}
            </div>
          </main>
        )}

        {view === 'ready' && (
          <div style={{textAlign:'center', background:'#111', padding:'30px', borderRadius:'30px'}}>
            <img src={selectedArtistImg} style={{width:'80px', borderRadius:'50%'}} alt="artist" />
            <h2>{selectedArtist}</h2>
            <button style={{width:'100%', padding:'15px', background:'#E50914', color:'#fff', border:'none', borderRadius:'10px', fontWeight:'bold'}} onClick={() => setView('game')}>START</button>
          </div>
        )}

        {view === 'game' && allRounds[roundIndex] && (
          <div style={{textAlign:'center', background:'#111', padding:'20px', borderRadius:'20px'}}>
            <p>ROUND {roundIndex+1}/10</p>
            <audio autoPlay src={allRounds[roundIndex].preview} />
            <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'20px'}}>
              {allRounds[roundIndex].choices.map(c => (
                <button key={c.id} style={{padding:'15px', background:'#222', color:'#fff', border:'none', borderRadius:'10px', textAlign:'left'}} onClick={() => handleAnswer(c.id === allRounds[roundIndex].correctId)}>{c.title}</button>
              ))}
            </div>
          </div>
        )}

        {view === 'results' && (
          <div style={{textAlign:'center', background:'#111', padding:'30px', borderRadius:'30px'}}>
            <h2>{score}/10</h2>
            <button style={{width:'100%', padding:'15px', background:'#1da1f2', color:'#fff', border:'none', borderRadius:'10px', fontWeight:'bold', marginTop:'20px'}} onClick={() => setView('share')}>SHARE RESULT</button>
            <button style={{width:'100%', padding:'15px', background:'#E50914', color:'#fff', border:'none', borderRadius:'10px', fontWeight:'bold', marginTop:'10px'}} onClick={() => setView('home')}>PLAY AGAIN</button>
          </div>
        )}

        {view === 'share' && (
          <div style={{textAlign: 'center'}}>
            <div style={{
              background: '#050505', 
              padding: '40px 20px', 
              borderRadius: '40px', 
              border: '5px solid #E50914', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              position: 'relative'
            }}>
              <div style={{color: '#E50914', fontWeight: 'bold', letterSpacing: '5px', marginBottom: '20px'}}>VECTFLIX</div>
              
              {/* IMAGE + BADGE: Explicitly defined for mobile */}
              <div style={{position: 'relative', width: '160px', height: '160px', zIndex: 5}}>
                <img 
                  src={localStorage.getItem('peak_artist_img') || selectedArtistImg} 
                  style={{width: '100%', height: '100%', borderRadius: '50%', border: '4px solid #E50914', objectFit: 'cover'}} 
                  alt="artist" 
                />
                <div style={{
                  position: 'absolute', bottom: '5px', right: '5px', 
                  background: '#1da1f2', width: '35px', height: '35px', 
                  borderRadius: '50%', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', color: 'white', fontSize: '20px', 
                  border: '3px solid #000', fontWeight: 'bold', zIndex: 10
                }}>✓</div>
              </div>

              {/* NAME: Forced font color and weight */}
              <h2 style={{
                color: '#ffffff', 
                fontSize: '1.8rem', 
                margin: '15px 0 0 0', 
                fontWeight: '900', 
                textTransform: 'uppercase',
                display: 'block',
                visibility: 'visible'
              }}>
                {localStorage.getItem('peak_artist_name') || selectedArtist || "TOP ARTIST"}
              </h2>
              
              <div style={{color: '#E50914', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '2px', marginTop: '5px'}}>VERIFIED ARTIST</div>
              
              <div style={{fontSize: '6rem', fontWeight: '900', color: '#E50914', margin: '10px 0'}}>{score}/10</div>
              
              <div style={{fontSize: '0.6rem', opacity: 0.4, borderTop: '1px solid #222', paddingTop: '15px', width: '80%'}}>
                musicquiz-github-io.vercel.app
              </div>
            </div>
            
            <button style={{width:'100%', padding:'15px', background:'#222', color:'#fff', border:'none', borderRadius:'10px', marginTop:'20px'}} onClick={() => {navigator.clipboard.writeText(`I scored ${score}/10 on ${selectedArtist}!`); alert("Copied!");}}>📋 COPY SCORE</button>
            <button style={{width:'100%', padding:'15px', background:'transparent', color:'#aaa', border:'none'}} onClick={() => setView('results')}>← BACK</button>
          </div>
        )}

      </div>
    </div>
  );
}
