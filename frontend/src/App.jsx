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

  // 1. Load Artists & Leaderboard on Start
  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(setArtists);
    fetchLB();
    const interval = setInterval(fetchLB, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchLB = () => {
    fetch(`${API_URL}/api/leaderboard`).then(res => res.json()).then(setLeaderboard);
  };

  // 2. Auth Logic (Login/Signup)
  const handleAuth = async (e) => {
    e.preventDefault();
    const path = authMode === 'login' ? '/api/login' : '/api/register';
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        if(authMode === 'login') {
            setUser(data.username);
            alert(`Welcome back, ${data.username}!`);
        } else {
            alert("Account created! Please Login.");
            setAuthMode('login');
        }
      } else { alert(data.error); }
    } catch (err) { alert("Server error. Try again."); }
  };

  // 3. Search Logic
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    fetch(`${API_URL}/api/search/${searchTerm}`)
      .then(res => res.json())
      .then(setArtists);
  };

  // 4. Start Game Logic
  const startFullGame = async (artistId, artistName) => {
    setLoading(true);
    setSelectedArtist(artistName);
    try {
      const res = await fetch(`${API_URL}/api/game/setup/${artistId}`);
      const data = await res.json();
      
      if (!data || data.length < 5) {
        alert("Not enough songs found for this artist. Try another!");
        setLoading(false);
        return;
      }

      setAllRounds(data);
      setScore(0);
      setRoundIndex(0);
      setStartTime(Date.now());
      setView('game');
    } catch (err) { 
        alert("Server is waking up... try again in 10s."); 
    } finally { 
        setLoading(false); 
    }
  };

  // 5. Handle Answer
  const handleAnswer = async (wasCorrect) => {
    const newScore = wasCorrect ? score + 1 : score;
    if (wasCorrect) setScore(newScore);

    // If more rounds exist, go to next
    if (roundIndex < 9 && roundIndex < allRounds.length - 1) {
      setTimeout(() => setRoundIndex(prev => prev + 1), 200); // Small delay prevents glitches
    } else {
      // Game Over
      const finalTime = Math.floor((Date.now() - startTime) / 1000);
      setTotalTime(finalTime);
      setView('results');

      if (user) {
        await fetch(`${API_URL}/api/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, score: newScore, time: finalTime, artist: selectedArtist })
        });
        fetchLB(); // Refresh leaderboard immediately
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle} onClick={() => window.location.reload()}>VECTFLIX</h1>

      {view === 'home' && (
        <>
          {/* LOGIN / SIGNUP BOX */}
          {!user ? (
            <div style={styles.authCard}>
                <h3 style={{fontSize: '0.8rem', color: '#E50914', marginBottom: '10px'}}>{authMode.toUpperCase()}</h3>
                <form onSubmit={handleAuth} style={styles.authForm}>
                    <input placeholder="Username" style={styles.input} onChange={e => setFormData({...formData, username: e.target.value})} required />
                    <input type="password" placeholder="Password" style={styles.input} onChange={e => setFormData({...formData, password: e.target.value})} required />
                    <button style={styles.goBtn}>GO</button>
                </form>
                <p onClick={() => setAuthMode(authMode==='login'?'signup':'login')} style={styles.toggleText}>
                    {authMode==='login' ? 'Need account? Sign Up' : 'Have account? Login'}
                </p>
            </div>
          ) : <div style={styles.userBadge}>User: {user}</div>}

          {/* LEADERBOARD */}
          <div style={styles.leaderboardSection}>
            <h4 style={styles.lbTitle}>GLOBAL TOP 10</h4>
            {leaderboard.map((lb, i) => (
                <div key={i} style={styles.lbRow}>
                    <span>{i+1}. {lb.username}</span>
                    <span style={{color: '#E50914'}}>{lb.score*10}%</span>
                    <span>{lb.time}s</span>
                </div>
            ))}
          </div>

          {/* SEARCH BAR */}
          <form onSubmit={handleSearch} style={styles.searchBox}>
            <input 
                style={styles.searchBar} 
                placeholder="Search artist..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <button type="submit" style={styles.goBtn}>SEARCH</button>
          </form>

          {loading && <p style={{color: '#E50914'}}>Loading Game...</p>}

          <div style={styles.artistGrid}>
            {artists.map(a => (
              <div key={a.id} style={styles.artistCard} onClick={() => startFullGame(a.id, a.name)}>
                <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                <p style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{a.name}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* GAME ROUND */}
      {view === 'game' && allRounds[roundIndex] && (
        <GameRound 
          key={roundIndex} // IMPORTANT: This forces the timer to reset perfectly every round
          roundData={allRounds[roundIndex]} 
          roundNum={roundIndex + 1} 
          onAnswer={handleAnswer} 
        />
      )}

      {/* RESULTS SCREEN */}
      {view === 'results' && (
        <div style={styles.resultsContainer}>
            <div style={styles.scoreCard}>
                <div style={styles.artistBadge}>{selectedArtist}</div>
                <h2 style={{fontSize: '3rem', margin: '15px 0'}}>{(score/10)*100}%</h2>
                <p>TIME: {totalTime}s</p>
            </div>
            <button style={styles.playBtn} onClick={() => window.location.reload()}>RETRY</button>
            <button style={styles.shareBtn} onClick={() => {
                const text = `🔥 I scored ${(score/10)*100}% on ${selectedArtist} in ${totalTime}s! Beat me on Vectflix!`;
                navigator.clipboard.writeText(text);
                alert("Copied to clipboard!");
            }}>SHARE SCORE</button>
        </div>
      )}
    </div>
  );
}

// Sub-component for Game Round
function GameRound({ roundData, roundNum, onAnswer }) {
    const [timeLeft, setTimeLeft] = useState(10);
    const audioRef = useRef(null);
  
    useEffect(() => {
      // Create and play audio
      const audio = new Audio(roundData.preview);
      audioRef.current = audio;
      audio.play().catch(e => console.log("Autoplay blocked"));
  
      // Start Timer
      const timer = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                if(audioRef.current) audioRef.current.pause();
                onAnswer(false); // Time out = wrong
                return 0;
            }
            return prev - 1;
        });
      }, 1000);
  
      // Cleanup on unmount (when moving to next round)
      return () => { 
        clearInterval(timer); 
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null; 
        }
      };
    }, []); 
  
    return (
      <div style={styles.gameWrapper}>
        <p style={{color: '#E50914', fontWeight: 'bold'}}>ROUND {roundNum}</p>
        <div style={styles.timerBar}><div style={{...styles.timerFill, width: `${timeLeft*10}%`}}></div></div>
        <div style={styles.choicesGrid}>
          {roundData.choices.map(c => (
            <button key={c.id} style={styles.choiceBtn} onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                onAnswer(c.id === roundData.correctId);
            }}>
              {c.title}
            </button>
          ))}
        </div>
      </div>
    );
}

const styles = {
  container: { background: '#141414', color: 'white', minHeight: '100vh', padding: '20px', textAlign: 'center', fontFamily: 'Arial' },
  mainTitle: { color: '#E50914', letterSpacing: '4px', cursor: 'pointer', fontWeight: '900', fontSize: '1.5rem', marginBottom: '20px' },
  authCard: { background: '#000', padding: '15px', borderRadius: '8px', border: '1px solid #333', marginBottom: '20px', maxWidth: '350px', margin: '0 auto 20px' },
  authForm: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' },
  input: { background: '#222', color: '#fff', border: '1px solid #444', padding: '10px', borderRadius: '4px', width: '100px' },
  goBtn: { background: '#E50914', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  toggleText: { fontSize: '0.75rem', marginTop: '10px', cursor: 'pointer', color: '#888' },
  userBadge: { background: '#E50914', padding: '5px 15px', borderRadius: '20px', display: 'inline-block', marginBottom: '20px', fontSize: '0.8rem', fontWeight: 'bold' },
  searchBox: { display: 'flex', gap: '10px', maxWidth: '400px', margin: '0 auto 20px' },
  searchBar: { flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #333', background: '#000', color: 'white' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '40px' },
  artistCard: { cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '6px', marginBottom: '8px' },
  leaderboardSection: { background: '#000', padding: '15px', borderRadius: '10px', border: '1px solid #333', maxWidth: '400px', margin: '0 auto 30px' },
  lbTitle: { margin: '0 0 10px 0', fontSize: '0.7rem', letterSpacing: '2px', color: '#E50914' },
  lbRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 0', borderBottom: '1px solid #222' },
  gameWrapper: { maxWidth: '400px', margin: '20px auto', background: '#1f1f1f', padding: '20px', borderRadius: '12px', border: '1px solid #333' },
  timerBar: { width: '100%', height: '5px', background: '#333', margin: '15px 0' },
  timerFill: { height: '100%', background: '#E50914', transition: '1s linear' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceBtn: { padding: '15px', background: '#2a2a2a', color: '#fff', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' },
  resultsContainer: { padding: '20px' },
  scoreCard: { background: '#000', padding: '40px 20px', borderRadius: '15px', border: '2px solid #E50914', maxWidth: '300px', margin: '0 auto 20px' },
  artistBadge: { background: '#E50914', display: 'inline-block', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '10px' },
  playBtn: { background: '#E50914', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: '4px', marginRight: '10px', cursor: 'pointer', fontWeight: 'bold' },
  shareBtn: { background: '#fff', color: '#000', padding: '12px 24px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};
