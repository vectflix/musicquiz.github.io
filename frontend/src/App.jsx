import React, { useState, useEffect, useRef } from 'react';

// REPLACE with your actual Render URL
const API_URL = "https://music-guessing-api-v2.onrender.com"; 

export default function App() {
  const [view, setView] = useState('home'); 
  const [artists, setArtists] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats tracking
  const [selectedArtist, setSelectedArtist] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/artists`)
      .then(res => res.json())
      .then(setArtists)
      .catch(() => console.log("Server waking up..."));
  }, []);

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
    } catch (err) {
      alert("Wake-up call sent! Try again in a few seconds.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (wasCorrect) => {
    if (wasCorrect) setScore(s => s + 1);
    if (roundIndex < 9) {
      setRoundIndex(prev => prev + 1);
    } else {
      const endTime = Date.now();
      setTotalTime(Math.floor((endTime - startTime) / 1000));
      setView('results');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm) return;
    fetch(`${API_URL}/api/search/${searchTerm}`)
      .then(res => res.json())
      .then(setArtists);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle} onClick={() => window.location.reload()}>VECTFLIX MUSIC</h1>

      {view === 'home' && (
        <>
          <div style={styles.heroBanner}>
            <div style={styles.heroOverlay}>
              <h2 style={{fontSize: '2rem', margin: 0}}>VECTFLIX</h2>
              <p>Guess 10 songs. Race against time.</p>
            </div>
          </div>

          <form onSubmit={handleSearch} style={styles.searchBox}>
            <input 
              style={styles.searchBar} 
              placeholder="Search artist..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" style={styles.goBtn}>GO</button>
          </form>

          {loading && <p style={{color: '#E50914', fontWeight: 'bold'}}>WAKING UP SERVER...</p>}

          <div style={styles.artistGrid}>
            {artists.map(a => (
              <div key={a.id} style={styles.artistCard} onClick={() => startFullGame(a.id, a.name)}>
                <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                <p style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{a.name}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'game' && allRounds[roundIndex] && (
        <GameRound 
          key={roundIndex}
          roundData={allRounds[roundIndex]} 
          roundNum={roundIndex + 1} 
          onAnswer={handleAnswer} 
        />
      )}

      {view === 'results' && (
        <div style={styles.resultsContainer}>
          <div style={styles.scoreCard}>
            {/* THE ARTIST BADGE */}
            <div style={styles.artistBadge}>{selectedArtist}</div>
            
            <div style={styles.scoreCircle}>
                <span style={{fontSize: '2.5rem', fontWeight: '900'}}>{(score/10)*100}%</span>
            </div>

            <div style={styles.statsRow}>
               <div style={styles.statBox}>
                  <span style={styles.statLabel}>SCORE</span>
                  <span style={styles.statValue}>{score}/10</span>
               </div>
               <div style={styles.statBox}>
                  <span style={styles.statLabel}>TIME</span>
                  <span style={styles.statValue}>{totalTime}s</span>
               </div>
            </div>
          </div>
          
          <button style={styles.playBtn} onClick={() => window.location.reload()}>RETRY</button>
          <button style={styles.shareBtn} onClick={() => alert(`I scored ${(score/10)*100}% on ${selectedArtist} in ${totalTime}s!`)}>SHARE</button>
        </div>
      )}
    </div>
  );
}

function GameRound({ roundData, roundNum, onAnswer }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const audioRef = useRef(new Audio(roundData.preview));

  useEffect(() => {
    const audio = audioRef.current;
    audio.src = roundData.preview;
    audio.play().catch(() => {});
    
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    const timeout = setTimeout(() => {
        audio.pause();
        onAnswer(false);
    }, 10000);

    return () => { 
        clearInterval(timer); 
        clearTimeout(timeout); 
        audio.pause(); 
    };
  }, [roundData, onAnswer]);

  return (
    <div style={styles.gameWrapper}>
      <p style={{color: '#E50914', fontWeight: 'bold', marginBottom: '5px'}}>ROUND {roundNum}</p>
      <div style={styles.timerBar}><div style={{...styles.timerFill, width: `${timeLeft*10}%`}}></div></div>
      <div style={styles.choicesGrid}>
        {roundData.choices.map(choice => (
          <button key={choice.id} style={styles.choiceBtn} onClick={() => { audioRef.current.pause(); onAnswer(choice.id === roundData.correctId); }}>
            {choice.title}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { background: '#141414', color: 'white', minHeight: '100vh', padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' },
  mainTitle: { color: '#E50914', fontSize: '1.2rem', fontWeight: '900', cursor: 'pointer', marginBottom: '20px' },
  heroBanner: { height: '150px', background: 'url("https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=800")', backgroundSize: 'cover', borderRadius: '8px', marginBottom: '20px' },
  heroOverlay: { height: '100%', background: 'linear-gradient(to top, #141414, transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  searchBox: { display: 'flex', maxWidth: '400px', margin: '0 auto 30px', gap: '8px' },
  searchBar: { flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid #333', background: '#000', color: 'white', outline: 'none' },
  goBtn: { padding: '0 20px', background: '#E50914', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px' },
  artistCard: { cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '4px', marginBottom: '5px' },
  gameWrapper: { maxWidth: '400px', margin: '40px auto', background: '#1f1f1f', padding: '30px', borderRadius: '12px', border: '1px solid #333' },
  timerBar: { width: '100%', height: '6px', background: '#333', margin: '15px 0', borderRadius: '10px', overflow: 'hidden' },
  timerFill: { height: '100%', background: '#E50914', transition: '1s linear' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' },
  choiceBtn: { padding: '15px', background: '#2a2a2a', color: 'white', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' },
  
  // Results UI
  resultsContainer: { padding: '40px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreCard: { background: '#000', padding: '30px 20px', borderRadius: '20px', border: '2px solid #333', width: '100%', maxWidth: '300px', marginBottom: '30px', position: 'relative' },
  artistBadge: { background: '#E50914', color: 'white', padding: '6px 15px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', display: 'inline-block', marginBottom: '15px' },
  scoreCircle: { width: '130px', height: '130px', border: '6px solid #E50914', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px auto 25px' },
  statsRow: { display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #333', paddingTop: '20px' },
  statBox: { display: 'flex', flexDirection: 'column' },
  statLabel: { fontSize: '0.7rem', color: '#888', fontWeight: 'bold' },
  statValue: { fontSize: '1.1rem', fontWeight: 'bold' },
  playBtn: { background: '#E50914', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '4px', fontWeight: 'bold', marginBottom: '10px', width: '200px', cursor: 'pointer' },
  shareBtn: { background: '#fff', color: '#000', padding: '12px 30px', border: 'none', borderRadius: '4px', fontWeight: 'bold', width: '200px', cursor: 'pointer' }
};
