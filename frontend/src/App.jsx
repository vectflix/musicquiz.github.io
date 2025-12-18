import React, { useState, useEffect, useRef } from 'react';

const API_URL = https://music-guessing-api-v2.onrender.com

export default function App() {
  const [view, setView] = useState('home'); 
  const [artists, setArtists] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/artists`)
      .then(res => res.json())
      .then(setArtists)
      .catch(err => console.error("Connecting to server..."));
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if(!searchTerm) return;
    setIsSearching(true);
    fetch(`${API_URL}/api/search/${searchTerm}`)
      .then(res => res.json())
      .then(data => {
        setArtists(data);
        setIsSearching(false);
      })
      .catch(err => {
        setIsSearching(false);
        alert("Server is waking up. Try again in a moment!");
      });
  };

  const startFullGame = async (artistId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/game/setup/${artistId}`);
      const data = await res.json();
      setAllRounds(data);
      setScore(0);
      setRoundIndex(0);
      setView('game');
    } catch (err) {
      alert("Wake-up call sent to server! Wait 30s and click again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (wasCorrect) => {
    if (wasCorrect) setScore(s => s + 1);
    if (roundIndex < 9) {
      setRoundIndex(roundIndex + 1);
    } else {
      setView('results');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle} onClick={() => window.location.reload()}>
        TEST YOUR MUSIC KNOWLEDGE
      </h1>

      {view === 'home' && (
        <>
          <div style={styles.heroBanner}>
            <div style={styles.heroOverlay}>
              <h2 style={{fontSize: '2rem', margin: '0'}}>VECTFLIX MUSIC</h2>
              <p>10 Rounds • 10 Seconds • 100% Skill</p>
            </div>
          </div>

          {/* SEARCH SECTION WITH GO BUTTON */}
          <div style={styles.searchContainer}>
            <form onSubmit={handleSearch} style={styles.searchForm}>
              <input 
                style={styles.searchBar} 
                placeholder="Artist name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" style={styles.goButton}>
                {isSearching ? '...' : 'GO'}
              </button>
            </form>
          </div>

          {loading && <p style={{color: '#E50914', fontWeight: 'bold'}}>Preparing Your Quiz...</p>}

          <div style={styles.artistGrid}>
            {artists.map(a => (
              <div key={a.id} style={styles.artistCard} onClick={() => startFullGame(a.id)}>
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
          <h2 style={{color: '#E50914'}}>GAME OVER</h2>
          <div style={styles.scoreCircle}>
            <span style={{fontSize: '3rem', fontWeight: 'bold'}}>{(score/10)*100}%</span>
          </div>
          <p>You got {score} / 10</p>
          <button style={styles.playBtn} onClick={() => window.location.reload()}>RETRY</button>
          <button style={styles.shareBtn} onClick={() => alert(`I scored ${(score/10)*100}% on Vectflix!`)}>SHARE</button>
        </div>
      )}

      <footer style={styles.footer}>
        <a href="https://www.instagram.com/vecteezy_1" target="_blank" rel="noreferrer" style={styles.instaLink}>
          @vecteezy_1
        </a>
      </footer>
    </div>
  );
}

function GameRound({ roundData, roundNum, onAnswer }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const audioRef = useRef(new Audio(roundData.preview));

  useEffect(() => {
    audioRef.current.src = roundData.preview;
    audioRef.current.play().catch(() => {});
    
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    const timeout = setTimeout(() => {
        audioRef.current.pause();
        onAnswer(false);
    }, 10000);

    return () => { 
        clearInterval(timer); 
        clearTimeout(timeout); 
        audioRef.current.pause(); 
    };
  }, [roundData]);

  return (
    <div style={styles.gameWrapper}>
      <h3 style={{color: '#E50914'}}>ROUND {roundNum}</h3>
      <div style={styles.timerContainer}>
        <div style={{...styles.timerFill, width: `${(timeLeft/10)*100}%`}}></div>
      </div>
      <p>{timeLeft > 0 ? timeLeft : 0}s</p>
      
      <div style={styles.choicesGrid}>
        {roundData.choices.map(choice => (
          <button 
            key={choice.id} 
            style={styles.choiceButton}
            onClick={() => { audioRef.current.pause(); onAnswer(choice.id === roundData.correctId); }}
          >
            {choice.title}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { background: '#141414', color: 'white', minHeight: '100vh', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' },
  mainTitle: { color: '#E50914', fontSize: '1.2rem', fontWeight: '900', cursor: 'pointer' },
  heroBanner: { height: '200px', background: 'url("https://images.unsplash.com/photo-1514525253361-bee871847e7c?auto=format&fit=crop&w=800")', backgroundSize: 'cover', borderRadius: '8px', marginBottom: '20px' },
  heroOverlay: { height: '100%', background: 'linear-gradient(to top, #141414, transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  
  // NEW SEARCH STYLES
  searchContainer: { display: 'flex', justifyContent: 'center', marginBottom: '30px' },
  searchForm: { display: 'flex', width: '90%', maxWidth: '400px', gap: '5px' },
  searchBar: { flex: 1, padding: '12px', borderRadius: '4px', border: '1px solid #333', background: '#000', color: 'white', outline: 'none' },
  goButton: { padding: '0 20px', background: '#E50914', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' },
  artistCard: { cursor: 'pointer' },
  artistImg: { width: '100%', borderRadius: '4px' },
  gameWrapper: { maxWidth: '400px', margin: '20px auto', background: '#1f1f1f', padding: '30px', borderRadius: '12px' },
  timerContainer: { width: '100%', height: '8px', background: '#444', borderRadius: '10px', margin: '15px 0' },
  timerFill: { height: '100%', background: '#E50914', transition: '1s linear' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  choiceButton: { padding: '15px', background: '#2a2a2a', color: 'white', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' },
  resultsContainer: { padding: '40px' },
  scoreCircle: { width: '120px', height: '120px', border: '5px solid #E50914', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '20px auto' },
  playBtn: { background: '#E50914', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', marginRight: '10px' },
  shareBtn: { background: 'white', color: 'black', padding: '10px 20px', border: 'none', borderRadius: '4px' },
  footer: { marginTop: '50px', padding: '20px', borderTop: '1px solid #333' },
  instaLink: { color: '#E50914', textDecoration: 'none', fontWeight: 'bold' }
};
