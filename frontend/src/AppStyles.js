const styles = {
  appWrapper: { 
    minHeight: '100vh', 
    background: 'radial-gradient(circle at top right, #2b0a0a, #000000, #050505)', 
    color: 'white', 
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px'
  },
  container: { 
    width: '100%', 
    maxWidth: '1200px', 
    margin: '0 auto'
  },
  header: { 
    width: '100%',
    padding: '20px 0', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    cursor: 'pointer',
    marginBottom: '40px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
  },
  logo: { 
    color: '#E50914', 
    fontSize: '1.8rem', 
    fontWeight: '900', 
    letterSpacing: '4px',
    textShadow: '0 0 15px rgba(229, 9, 20, 0.3)'
  },
  userBadge: { 
    background: 'rgba(255, 255, 255, 0.08)', 
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: '8px 18px', 
    borderRadius: '40px', 
    fontSize: '0.85rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
  },
  heroText: { 
    fontSize: '3.5rem', 
    marginBottom: '10px', 
    fontWeight: '900', 
    textAlign: 'center',
    letterSpacing: '-1px'
  },
  searchContainer: { 
    marginBottom: '50px', 
    position: 'relative',
    maxWidth: '650px',
    margin: '20px auto 50px auto'
  },
  searchInput: { 
    width: '100%', 
    padding: '22px 30px', 
    background: 'rgba(255, 255, 255, 0.03)', 
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)', 
    borderRadius: '20px', 
    color: 'white', 
    fontSize: '1.1rem', 
    outline: 'none', 
    boxSizing: 'border-box',
    boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
  },
  loaderLine: { 
    height: '3px', 
    background: '#E50914', 
    width: '40%', 
    position: 'absolute', 
    bottom: '0', 
    left: '30%',
    borderRadius: '10px',
    boxShadow: '0 0 10px #E50914'
  },
  artistGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
    gap: '20px',
    width: '100%'
  },
  artistCard: { 
    textAlign: 'center', 
    cursor: 'pointer',
    padding: '25px 15px',
    background: 'rgba(255, 255, 255, 0.02)',
    backdropFilter: 'blur(10px)',
    borderRadius: '30px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'transform 0.3s ease'
  },
  artistImg: { 
    width: '120px', 
    height: '120px',
    borderRadius: '50%', 
    border: '4px solid rgba(229, 9, 20, 0.2)', 
    marginBottom: '15px',
    objectFit: 'cover'
  },
  artistName: { 
    fontSize: '1rem', 
    fontWeight: 'bold', 
    letterSpacing: '0.5px',
    opacity: 0.9
  },
  gameCard: { 
    background: 'rgba(10, 10, 10, 0.6)', 
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    padding: '60px 40px', 
    borderRadius: '45px', 
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    maxWidth: '600px',
    margin: '40px auto'
  },
  glassCardResults: { 
    background: 'rgba(255, 255, 255, 0.03)', 
    backdropFilter: 'blur(35px)',
    WebkitBackdropFilter: 'blur(35px)',
    padding: '50px 30px', 
    borderRadius: '40px', 
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    maxWidth: '550px',
    margin: '0 auto'
  },
  progressBar: { 
    width: '100%', 
    height: '6px', 
    background: 'rgba(255,255,255,0.1)', 
    borderRadius: '10px', 
    marginBottom: '20px',
    overflow: 'hidden'
  },
  progressFill: { 
    height: '100%', 
    background: 'linear-gradient(90deg, #E50914, #ff4d4d)', 
    transition: 'width 0.5s ease-out' 
  },
  choicesGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  choiceBtn: { 
    padding: '20px 25px', 
    background: 'rgba(255, 255, 255, 0.05)', 
    color: 'white', 
    border: '1px solid rgba(255,255,255,0.1)', 
    borderRadius: '18px', 
    textAlign: 'left', 
    fontWeight: '600', 
    cursor: 'pointer',
    fontSize: '1.05rem'
  },
  playBtn: { 
    width: '100%', 
    padding: '20px', 
    background: '#E50914', 
    color: 'white', 
    border: 'none', 
    borderRadius: '18px', 
    fontWeight: '900', 
    fontSize: '1.2rem',
    cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(229, 9, 20, 0.4)'
  },
  shareCard: { 
    background: 'rgba(0, 0, 0, 0.5)', 
    backdropFilter: 'blur(40px)',
    padding: '60px 40px', 
    borderRadius: '60px', 
    border: '3px solid #E50914', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center'
  },
  verifiedBadge: { 
    background: '#1da1f2', 
    width: '24px', 
    height: '24px', 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontSize: '14px', 
    color: 'white',
    marginLeft: '8px'
  },
  linkButtonWhite: { textDecoration:'none', background:'rgba(255,255,255,0.9)', color:'#000', padding:'18px', borderRadius:'15px', fontWeight:'bold', display: 'block', marginBottom: '10px' },
  linkButtonGreen: { textDecoration:'none', background:'#1DB954', color:'#fff', padding:'18px', borderRadius:'15px', fontWeight:'bold', display: 'block' },
  footer: { 
    textAlign: 'center', 
    marginTop: '80px', 
    paddingBottom: '40px',
    width: '100%',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '40px'
  },
  instaLink: { color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '0.9rem', margin: '0 15px' },
  legalSection: { marginTop: '60px', width: '100%', maxWidth: '900px', margin: '60px auto 0 auto' },
  legalHeading: { fontSize: '0.8rem', textTransform: 'uppercase', color: '#E50914', marginBottom: '10px', letterSpacing: '2px', fontWeight: 'bold' },
  legalBody: { fontSize: '0.8rem', lineHeight: '1.8', marginBottom: '25px', opacity: 0.4 },
  countdownBox: { 
    padding: '40px', 
    background: 'rgba(255,255,255,0.02)', 
    borderRadius: '35px', 
    border: '2px solid rgba(229, 9, 20, 0.5)',
    display: 'inline-block',
    minWidth: '200px'
  },
  statusDot: { width: '10px', height: '10px', background: '#E50914', borderRadius: '50%', display: 'inline-block', marginRight: '10px' },
  adSlot: { margin: '40px 0', textAlign: 'center' },
  adPlaceholder: { minHeight: '150px', background: 'rgba(255,255,255,0.02)', borderRadius: '25px' },
  loginOverlay: { position: 'fixed', inset: 0, background: '#000', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  loginInput: { width: '100%', padding: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid #E50914', borderRadius: '15px', color: 'white', textAlign: 'center', margin: '25px 0', fontSize: '1.2rem' },
  resultsArtistImg: { width: '100px', height: '100px', borderRadius: '50%', marginBottom: '15px', objectFit: 'cover', border: '3px solid #E50914' }
};

export default styles;
