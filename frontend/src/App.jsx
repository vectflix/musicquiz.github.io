import React, { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function App() {
  const [view, setView] = useState('home'); 
  const [artists, setArtists] = useState([]);
  const [allRounds, setAllRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/artists`).then(res => res.json()).then(setArtists);
  }, []);

  const startFullGame = async (artistId) => {
    setLoading(true);
    const res = await fetch(`${API_URL}/api/game/setup/${artistId}`);
    const data = await res.json();
    setAllRounds(data);
    setScore(0);
    setRoundIndex(0);
    setView('game');
    setLoading(false);
  };

  const handleAnswer = (wasCorrect) => {
    if (wasCorrect) setScore(s => s + 1);
    if (roundIndex < 9) {
      setRoundIndex(r => r + 1);
    } else {
      setView('results');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle}>TEST YOUR MUSIC KNOWLEDGE</h1>

      {view === 'home' && (
        <>
          <div style={styles.heroBanner}>
            <div style={styles.heroOverlay}>
              <h2 style={{fontSize: '2.5rem', margin: '0'}}>VECTFLIX MUSIC</h2>
              <p style={{fontSize: '1.2rem'}}>10 Songs. 10 Seconds. Can you score 100%?</p>
            </div>
          </div>

          <input 
            style={styles.searchBar} 
            placeholder="🔍 Search for any artist in the world..." 
            onChange={(e) => fetch(`${API_URL}/api/search/${e.target.value}`).then(res => res.json()).then(setArtists)}
          />

          <div style={styles.artistGrid}>
            {artists.map(a => (
              <div key={a.id} style={styles.artistCard} onClick={() => startFullGame(a.id)}>
                <img src={a.picture_medium} style={styles.artistImg} alt={a.name} />
                <p style={{fontWeight: 'bold'}}>{a.name}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'game' && allRounds[roundIndex] && (
        <GameRound 
          roundData={allRounds[roundIndex]} 
          roundNum={roundIndex + 1} 
          onAnswer={handleAnswer} 
        />
      )}

      {view === 'results' && (
        <div style={styles.resultsContainer}>
          <h2 style={{color: '#E50914', fontSize: '2.5rem'}}>GAME OVER</h2>
          <div style={styles.scoreCircle}>
            <span style={{fontSize: '3.5rem', fontWeight: 'bold'}}>{(score/10)*100}%</span>
          </div>
          <p style={{fontSize: '1.5rem'}}>You got {score} out of 10 songs correct!</p>
          <button style={styles.playBtn} onClick={() => window.location.reload()}>RETRY CHALLENGE</button>
          <button style={styles.shareBtn} onClick={() => alert(`I scored ${(score/10)*100}% on Vectflix Music! Challenge me!`)}>SHARE SCORE</button>
        </div>
      )}

      <footer style={styles.footer}>
        <a href="https://www.instagram.com/vecteezy_1" target="_blank" rel="noreferrer" style={styles.instaLink}>
          Developer Instagram: @vecteezy_1
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
    audioRef.current.play();
    setTimeLeft(10);

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    const timeout = setTimeout(() => onAnswer(false), 10000); // 10 second limit

    return () => { clearInterval(timer); clearTimeout(timeout); audioRef.current.pause(); };
  }, [roundData]);

  return (
    <div style={styles.gameWrapper}>
      <h3 style={{color: '#E50914'}}>ROUND {roundNum} / 10</h3>
      <div style={styles.timerContainer}>
        <div style={{...styles.timerFill, width: `${(timeLeft/10)*100}%`}}></div>
      </div>
      <p style={{fontSize: '1.2rem', fontWeight: 'bold'}}>{timeLeft}s Remaining</p>
      
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
  container: { background: '#141414', color: 'white', minHeight: '100vh', padding: '20px', textAlign: 'center' },
  mainTitle: { color: '#E50914', fontSize: '1.5rem', fontWeight: '900', marginBottom: '20px' },
  heroBanner: { height: '300px', background: 'url("https://images.unsplash.com/photo-1514525253361-bee871847e7c?q=80&w=1964&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px', overflow: 'hidden', marginBottom: '30px' },
  heroOverlay: { height: '100%', background: 'linear-gradient(to top, #141414, transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  searchBar: { width: '90%', maxWidth: '600px', padding: '18px', borderRadius: '30px', border: 'none', background: '#333', color: 'white', fontSize: '1.1rem', marginBottom: '40px', outline: 'none' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '25px', maxWidth: '1100px', margin: '0 auto' },
  artistCard: { cursor: 'pointer', transition: '0.3s' },
  artistImg: { width: '100%', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.6)' },
  gameWrapper: { maxWidth: '500px', margin: '40px auto', background: '#1f1f1f', padding: '40px', borderRadius: '15px', border: '1px solid #333' },
  timerContainer: { width: '100%', height: '12px', background: '#444', borderRadius: '10px', margin: '20px 0', overflow: 'hidden' },
  timerFill: { height: '100%', background: '#E50914', transition: '1s linear' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '30px' },
  choiceButton: { padding: '18px', background: '#2a2a2a', color: 'white', border: '1px solid #444', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: '0.2s' },
  resultsContainer: { padding: '60px 20px' },
  scoreCircle: { width: '180px', height: '180px', border: '10px solid #E50914', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '30px auto' },
  playBtn: { background: '#E50914', color: 'white', padding: '15px 35px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', marginRight: '10px' },
  shareBtn: { background: 'white', color: 'black', padding: '15px 35px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },
  footer: { marginTop: '80px', padding: '30px', borderTop: '1px solid #333' },
  instaLink: { color: '#E50914', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }
};
