import React, { useState, useEffect, useRef } from 'react';

// REPLACE with your actual Render URL
const API_URL = "https://music-guessing-api-v2.onrender.com"; 

export default function App() {
  const [view, setView] = useState('home'); 
  const [user, setUser] = useState(null); 
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [leaderboard, setLeaderboard] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Game tracking
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedArtist, setSelectedArtist] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);

  // 1. Load Artists & Leaderboard
  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(setArtists);
    
    const fetchLB = () => fetch(`${API_URL}/api/leaderboard`).then(res => res.json()).then(setLeaderboard);
    fetchLB();
    const interval = setInterval(fetchLB, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // 2. Auth Logic
  const handleAuth = async (e) => {
    e.preventDefault();
    const path = authMode === 'login' ? '/api/login' : '/api/register';
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (res.ok) {
      if(authMode === 'login') setUser(data.username);
      alert(authMode === 'login' ? `Welcome ${data.username}!` : "Account created! Now login.");
    } else { alert(data.error); }
  };

  const startFullGame = async (artistId, artistName) => {
    setLoading(true);
    setSelectedArtist(artistName);
    try {
      const res = await fetch(`${API_URL}/api/game/setup/${artistId}`);
      const data = await res.json();
      setAllRounds(data);
      setScore(0);
      setRoundIndex(0);
      setStartTime(Date.now());
      setView('game');
    } catch (err) { alert("Server warming up..."); } finally { setLoading(false); }
  };

  const handleAnswer = async (wasCorrect) => {
    const newScore = wasCorrect ? score + 1 : score;
    if (wasCorrect) setScore(newScore);

    if (roundIndex < 9) {
      setRoundIndex(prev => prev + 1);
    } else {
      const finalTime = Math.floor((Date.now() - startTime) / 1000);
      setTotalTime(finalTime);
      setView('results');

      // SAVE TO DB IF LOGGED IN
      if (user) {
        await fetch(`${API_URL}/api/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, score: newScore, time: finalTime, artist: selectedArtist })
        });
      }
    }
  };

  const shareScore = () => {
    const text = `🔥 I scored ${(score/10)*100}% on the ${selectedArtist} challenge in ${totalTime}s! Beat me on Vectflix!`;
    if (navigator.share) {
      navigator.share({ title: 'Vectflix', text, url: window.location.href });
    } else {
      alert("Score copied to clipboard!");
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle} onClick={() => window.location.reload()}>VECTFLIX</h1>

      {!user ? (
        <div style={styles.authCard}>
          <h3 style={{fontSize: '0.8rem', color: '#E50914'}}>{authMode.toUpperCase()} TO SAVE SCORES</h3>
          <form onSubmit={handleAuth} style={styles.authForm}>
            <input placeholder="Username" style={styles.input} onChange={e => setFormData({...formData, username: e.target.value})} />
            <input type="password" placeholder="Password" style={styles.input} onChange={e => setFormData({...formData, password: e.target.value})} />
            <button type="submit" style={styles.goBtn}>{authMode === 'login' ? 'LOGIN' : 'SIGN UP'}</button>
          </form>
          <p onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={styles.toggleText}>
            {authMode === 'login' ? "Don't have an account? Sign Up" : "Have an account? Login"}
          </p>
        </div>
      ) : (
        <div style={styles.userBadge}>User: {user}</div>
      )}

      {view === 'home' && (
        <>
          <div style={styles.leaderboardSection}>
            <h4 style={styles.lbTitle}>LIVE RANKINGS</h4>
            {leaderboard.map((lb, i) => (
              <div key={i} style={styles.lbRow}>
                <span>{i+1}. {lb.username}</span>
                <span style={{color: '#E50914'}}>{lb.score*10}%</span>
                <span>{lb.time}s</span>
              </div>
            ))}
          </div>

          <div style={styles.artistGrid}>
            {artists.map(a => (
              <div key={a.id} style={styles.artistCard} onClick={() => startFullGame(a.id, a.name)}>
                <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                <p style={{fontSize: '0.8rem'}}>{a.name}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'game' && allRounds[roundIndex] && (
        <GameRound roundData={allRounds[roundIndex]} roundNum={roundIndex + 1} onAnswer={handleAnswer} />
      )}

      {view === 'results' && (
        <div style={styles.resultsContainer}>
            <div style={styles.scoreCard}>
                <div style={styles.artistBadge}>{selectedArtist}</div>
                <h2 style={{fontSize: '3rem'}}>{(score/10)*100}%</h2>
                <p>TIME: {totalTime}s</p>
            </div>
            <button style={styles.playBtn} onClick={() => window.location.reload()}>RETRY</button>
            <button style={styles.shareBtn} onClick={shareScore}>SHARE</button>
        </div>
      )}
    </div>
  );
}

// Sub-component for Game Round (with 10s Timer)
function GameRound({ roundData, roundNum, onAnswer }) {
    const [timeLeft, setTimeLeft] = useState(10);
    const audioRef = useRef(new Audio(roundData.preview));
  
    useEffect(() => {
      const audio = audioRef.current;
      audio.src = roundData.preview;
      audio.play().catch(() => {});
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      const timeout = setTimeout(() => { audio.pause(); onAnswer(false); }, 10000);
      return () => { clearInterval(timer); clearTimeout(timeout); audio.pause(); };
    }, [roundData]);
  
    return (
      <div style={styles.gameWrapper}>
        <p style={{color: '#E50914'}}>ROUND {roundNum}</p>
        <div style={styles.timerBar}><div style={{...styles.timerFill, width: `${timeLeft*10}%`}}></div></div>
        <div style={styles.choicesGrid}>
          {roundData.choices.map(c => (
            <button key={c.id} style={styles.choiceBtn} onClick={() => { audioRef.current.pause(); onAnswer(c.id === roundData.correctId); }}>
              {c.title}
            </button>
          ))}
        </div>
      </div>
    );
}

const styles = {
  container: { background: '#141414', color: 'white', minHeight: '100vh', padding: '20px', textAlign: 'center', fontFamily: 'Arial' },
  mainTitle: { color: '#E50914', letterSpacing: '4px', cursor: 'pointer' },
  authCard: { background: '#000', padding: '15px', borderRadius: '8px', border: '1px solid #333', marginBottom: '20px' },
  authForm: { display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '10px' },
  input: { background: '#222', color: '#fff', border: '1px solid #444', padding: '8px', borderRadius: '4px', width: '100px' },
  goBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', fontWeight: 'bold' },
  toggleText: { fontSize: '0.7rem', marginTop: '10px', cursor: 'pointer', opacity: 0.7 },
  userBadge: { background: '#333', padding: '5px 15px', borderRadius: '20px', display: 'inline-block', marginBottom: '20px', fontSize: '0.8rem' },
  leaderboardSection: { background: '#000', padding: '15px', borderRadius: '10px', border: '1px solid #333', marginBottom: '30px' },
  lbTitle: { margin: '0 0 10px 0', fontSize: '0.7rem', letterSpacing: '2px', color: '#888' },
  lbRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '5px 0', borderBottom: '1px solid #222' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' },
  artistCard: { cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '4px' },
  gameWrapper: { maxWidth: '400px', margin: '40px auto', background: '#1f1f1f', padding: '20px', borderRadius: '10px' },
  timerBar: { width: '100%', height: '5px', background: '#333', margin: '15px 0' },
  timerFill: { height: '100%', background: '#E50914', transition: '1s linear' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '8px' },
  choiceBtn: { padding: '12px', background: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px' },
  resultsContainer: { padding: '20px' },
  scoreCard: { background: '#000', padding: '40px 20px', borderRadius: '15px', border: '2px solid #E50914', maxWidth: '300px', margin: '0 auto 20px' },
  artistBadge: { background: '#E50914', display: 'inline-block', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '10px' },
  playBtn: { background: '#E50914', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '4px', marginRight: '10px' },
  shareBtn: { background: '#fff', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '4px' }
};
