const { useState, useRef, useEffect } = React;

// Libreria jsmediatags per estrarre i metadati ID3
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js';
document.head.appendChild(script);

const MusicPlayer = () => {
  // Playlist - MODIFICA QUI CON I TUOI LINK DI GOOGLE DRIVE
  const audioFiles = [
    "https://drive.google.com/uc?export=download&id=1CO-1TWrZrTJOKMoBovw7-0F9iG0Pffoa", // Sostituisci con i tuoi ID file
    "https://drive.google.com/uc?export=download&id=TUO_ID_FILE_2",
    "https://drive.google.com/uc?export=download&id=TUO_ID_FILE_3",
    "https://drive.google.com/uc?export=download&id=TUO_ID_FILE_4",
    "https://drive.google.com/uc?export=download&id=TUO_ID_FILE_5",
    "https://drive.google.com/uc?export=download&id=TUO_ID_FILE_6",
    "https://drive.google.com/uc?export=download&id=TUO_ID_FILE_7",
    "https://drive.google.com/uc?export=download&id=TUO_ID_FILE_8",
  ];

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Carica i metadati dei file audio
  useEffect(() => {
    const loadMetadata = async () => {
      if (typeof window.jsmediatags === 'undefined') {
        // Attendi che la libreria jsmediatags sia caricata
        setTimeout(loadMetadata, 100);
        return;
      }
      
      const trackPromises = audioFiles.map((url, index) => {
        return new Promise((resolve) => {
          // Placeholder in caso di errore nella lettura dei tag
          const defaultTrack = {
            title: `Brano ${index + 1}`,
            artist: "Artista sconosciuto",
            album: "Album sconosciuto",
            trackNumber: index + 1,
            src: url,
            image: "https://via.placeholder.com/300"
          };

          window.jsmediatags.read(url, {
            onSuccess: function(tag) {
              const tags = tag.tags;
              
              // Estrai l'immagine dalla copertina se presente
              let imageUrl = "https://via.placeholder.com/300";
              if (tags.picture) {
                const { data, format } = tags.picture;
                const base64String = data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
                imageUrl = `data:${format};base64,${btoa(base64String)}`;
              }
              
              resolve({
                title: tags.title || defaultTrack.title,
                artist: tags.artist || defaultTrack.artist,
                album: tags.album || defaultTrack.album,
                trackNumber: tags.track || index + 1,
                src: url,
                image: imageUrl
              });
            },
            onError: function() {
              resolve(defaultTrack);
            }
          });
        });
      });

      try {
        // Attendi il caricamento di tutti i metadati
        const loadedTracks = await Promise.all(trackPromises);
        
        // Ordina per numero di traccia
        loadedTracks.sort((a, b) => {
          const trackNumA = typeof a.trackNumber === 'string' 
            ? parseInt(a.trackNumber.split('/')[0]) 
            : a.trackNumber;
          const trackNumB = typeof b.trackNumber === 'string' 
            ? parseInt(b.trackNumber.split('/')[0]) 
            : b.trackNumber;
          return trackNumA - trackNumB;
        });
        
        setTracks(loadedTracks);
        setLoading(false);
      } catch (error) {
        console.error("Errore nel caricamento dei metadati:", error);
        // In caso di errore, crea tracce con info di base
        const fallbackTracks = audioFiles.map((url, index) => ({
          title: `Brano ${index + 1}`,
          artist: "Artista sconosciuto",
          album: "Album sconosciuto",
          src: url,
          image: "https://via.placeholder.com/300"
        }));
        setTracks(fallbackTracks);
        setLoading(false);
      }
    };

    loadMetadata();
  }, []);

  const currentTrack = tracks[currentTrackIndex] || { 
    title: "Caricamento...", 
    artist: "", 
    src: "", 
    image: "https://via.placeholder.com/300" 
  };

  useEffect(() => {
    if (audioRef.current && !loading) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Errore durante la riproduzione:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex, loading]);

  const handlePlayPause = () => {
    if (loading) return;
    setIsPlaying(!isPlaying);
  };

  const handlePrev = () => {
    if (loading) return;
    setCurrentTrackIndex((prevIndex) => 
      prevIndex === 0 ? tracks.length - 1 : prevIndex - 1
    );
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (loading) return;
    setCurrentTrackIndex((prevIndex) => 
      prevIndex === tracks.length - 1 ? 0 : prevIndex + 1
    );
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTrackEnded = () => {
    handleNext();
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  // Formatta il tempo in minuti:secondi
  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const selectTrack = (index) => {
    if (loading) return;
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  if (loading) {
    return (
      <div className="player-container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: '2rem', marginBottom: '1rem'}}>⏳</div>
          <p>Caricamento del player in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-container">
      <h1 style={{fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '1rem'}}>
        {tracks.length > 0 ? tracks[0].album : "Il Mio Album"}
      </h1>
      
      {/* Album Cover */}
      <div style={{display: 'flex', justifyContent: 'center', marginBottom: '1rem'}}>
        <img 
          src={currentTrack.image} 
          alt={`${currentTrack.title} cover`} 
          style={{width: '256px', height: '256px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', objectFit: 'cover'}}
        />
      </div>

      {/* Track Info */}
      <div style={{textAlign: 'center', marginBottom: '1rem'}}>
        <h2 style={{fontSize: '1.25rem', fontWeight: '600'}}>{currentTrack.title}</h2>
        <p style={{color: '#666'}}>{currentTrack.artist}</p>
      </div>
      
      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleTrackEnded}
      />
      
      {/* Progress Bar */}
      <div style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
        <span style={{fontSize: '0.75rem'}}>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          style={{width: '100%', height: '8px', borderRadius: '8px', cursor: 'pointer'}}
        />
        <span style={{fontSize: '0.75rem'}}>{formatTime(duration)}</span>
      </div>
      
      {/* Controls */}
      <div style={{display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem'}}>
        <button 
          onClick={handlePrev}
          style={{backgroundColor: '#eee', padding: '0.75rem', borderRadius: '50%', border: 'none', cursor: 'pointer'}}
        >
          ⏮
        </button>
        <button 
          onClick={handlePlayPause} 
          style={{backgroundColor: '#3b82f6', color: 'white', padding: '0.75rem', borderRadius: '50%', border: 'none', cursor: 'pointer'}}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button 
          onClick={handleNext}
          style={{backgroundColor: '#eee', padding: '0.75rem', borderRadius: '50%', border: 'none', cursor: 'pointer'}}
        >
          ⏭
        </button>
      </div>
      
      {/* Playlist */}
      <div style={{marginTop: '1.5rem'}}>
        <h3 style={{fontWeight: '600', marginBottom: '0.5rem'}}>Playlist</h3>
        <div style={{maxHeight: '256px', overflowY: 'auto'}}>
          {tracks.map((track, index) => (
            <div 
              key={index}
              onClick={() => selectTrack(index)}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                padding: '0.5rem', 
                marginBottom: '0.25rem', 
                borderRadius: '4px',
                cursor: 'pointer', 
                backgroundColor: currentTrackIndex === index ? '#e6f0ff' : 'transparent',
              }}
              onMouseOver={(e) => {if(currentTrackIndex !== index) e.currentTarget.style.backgroundColor = '#f5f5f5'}}
              onMouseOut={(e) => {if(currentTrackIndex !== index) e.currentTarget.style.backgroundColor = 'transparent'}}
            >
              <div style={{width: '32px', height: '32px', marginRight: '0.75rem', flexShrink: 0}}>
                <img src={track.image} alt="" style={{width: '100%', height: '100%', borderRadius: '4px', objectFit: 'cover'}} />
              </div>
              <div style={{flexGrow: 1}}>
                <p style={{fontWeight: '500'}}>{track.title}</p>
                <p style={{fontSize: '0.875rem', color: '#666'}}>{track.artist}</p>
              </div>
              {currentTrackIndex === index && isPlaying && (
                <div style={{width: '16px'}}>🎵</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Renderizza il componente nella pagina
ReactDOM.render(<MusicPlayer />, document.getElementById('root'));
