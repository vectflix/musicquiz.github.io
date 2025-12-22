const styles = {
  appWrapper: { 
    minHeight: '100vh', 
    background: 'radial-gradient(circle at top right, #2b0a0a, #000000, #050505)', 
    color: 'white', 
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px',
    transition: 'background 1.5s ease'
  },
  container: { width: '95%', maxWidth: '1400px', margin: '0 auto' },
  header: { 
    width: '100%', padding: '20px 0', display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', cursor: 'pointer', marginBottom: '40px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  logo: { color: '#E50914', fontSize: '1.8rem', fontWeight: '900', letterSpacing: '4px', textShadow: '0 0 15px rgba(229, 9, 20, 0.3)' },
  userBadge: { background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)', padding: '8px 18px', borderRadius: '40px', fontSize: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.1)' },
  
  modeToggle: { display: 'flex', gap: '15px', marginBottom: '30px', justifyContent: 'center' },
  modeBtn: { padding: '12px 24px', borderRadius: '30px', border: '1px solid #E50914', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: '900', fontSize: '0.8rem', transition: '0.3s' },
  activeMode: { background: '#E50914', boxShadow: '0 0 20px rgba(229, 9, 20, 0.5)' },

  heroText: { fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '10px', fontWeight: '900', textAlign: 'center', letterSpacing: '-1px' },
  searchContainer: { marginBottom: '40px', position: 'relative', maxWidth: '650px', margin: '20px auto' },
  searchInput: { width: '100%', padding: '22px 30px', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px', color: 'white', fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box' },
  loaderLine: { height: '3px', background: '#E50914', width: '40%', position: 'absolute', bottom: '0', left: '30%', borderRadius: '10px', boxShadow: '0 0 10px #E50914' },

  // ARTIST GRID - Updated for responsive Peak sizing
  artistGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
    gap: '25px', 
    width: '100%' 
  },
  // Added a specific mobile version of the grid columns
  artistGridMobile: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '12px'
  },
  
  artistCard: { 
    textAlign: 'center', 
    cursor: 'pointer', 
    padding: '20px', 
    background: 'rgba(255, 255, 255, 0.02)', 
    backdropFilter: 'blur(10px)', 
    borderRadius: '30px', 
    border: '1px solid rgba(255, 255, 255, 0.05)', 
    transition: '0.3s' 
  },
  artistCardMobile: { padding: '12px', borderRadius: '20px' },
  
  artistImg: { 
    width: '120px', 
    height: '120px', 
    borderRadius: '50%', 
    border: '4px solid rgba(229, 9, 20, 0.2)', 
    marginBottom: '15px', 
    objectFit: 'cover' 
  },
  artistImgMobile: { width: '80px', height: '80px', marginBottom: '8px' },
  
  artistName: { fontSize: '1rem', fontWeight: 'bold', opacity: 0.9 },
  artistNameMobile: { fontSize: '0.75rem' },

  // NEWS SECTION - Updated for headline-only sleekness
  newsGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
    gap: '20px', 
    marginTop: '20px' 
  },
  newsGridMobile: {
    gridTemplateColumns: '1fr', // Stacked headlines on mobile for better readability
    gap: '12px'
  },
  newsCard: { background: 'rgba(255, 255, 255, 0.03)', padding: '25px', borderRadius: '25px', border: '1px solid rgba(255, 255, 255, 0.05)' },
  newsCardMobile: { padding: '15px' },
  newsTag: { color: '#E50914', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px', display: 'block' },

  // GAME UI (Unchanged as requested)
  gameCard: { background: 'rgba(10, 10, 10, 0.6)', backdropFilter: 'blur(30px)', padding: '60px 40px', borderRadius: '45px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.1)', maxWidth: '600px', margin: '40px auto' },
  glassCardResults: { background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(35px)', padding: '50px 30px', borderRadius: '40px', textAlign: 'center', border: '1px solid rgba(255, 255, 255, 0.08)', maxWidth: '550px', margin: '0 auto' },
  progressBar: { width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #E50914, #ff4d4d)', transition: 'width 0.5s ease-out' },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  choiceBtn: { padding: '20px 25px', background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', textAlign: 'left', fontWeight: '600', cursor: 'pointer' },
  playBtn: { width: '100%', padding: '20px', background: '#E50914', color: 'white', border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer' },
  
  footer: { textAlign: 'center', marginTop: '80px', paddingBottom: '40px', width: '100%', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '40px' },
  instaLink: { color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '0.9rem', margin: '0 15px' },
  legalSection: { marginTop: '60px', width: '100%', maxWidth: '1000px', margin: '60px auto 0 auto' },
  legalHeading: { fontSize: '0.8rem', textTransform: 'uppercase', color: '#E50914', marginBottom: '10px', fontWeight: 'bold' },
  legalBody: { fontSize: '0.8rem', lineHeight: '1.8', marginBottom: '25px', opacity: 0.4 },
  loginOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loginInput: { width: '100%', padding: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid #E50914', borderRadius: '15px', color: 'white', textAlign: 'center', fontSize: '1.2rem' }
};

export default styles;
