// src/components/ArtistGrid.jsx
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const ArtistGrid = ({ artists, onArtistClick, imageContext = 'base', gridRef, sentinelRef }) => {
  const navigate = useNavigate();

  const handleArtistClick = (artist) => {
    if (onArtistClick) {
      onArtistClick(artist);
    } else {
      navigate(`/artist/${artist.id}`);
    }
  };

  return (
    <div className="artist-grid">
      <div className="artist-grid-container" ref={gridRef}>
        {artists.map((artist) => {
          const imageUrl = apiService.getImageUrl(artist.image_path, imageContext);
          console.log(`id: ${artist.id} Artist: ${artist.name}, Image Path: ${artist.image_path}, Final URL: ${imageUrl}`);

          return (
            <div
              key={artist.id}
              className="artist-card"
              onClick={() => handleArtistClick(artist)}
            >
              <div className="artist-card-image">
                <img
                  src={imageUrl}
                  alt={artist.name}
                  onError={(e) => {
                    if (e.target.src.includes('/sm/')) {
                      e.target.src = e.target.src.replace('/sm/', '/');
                      e.target.onerror = null;
                    }
                  }}
                />
              </div>

              <div className="artist-card-title">
                <h3>{artist.name}</h3>
              </div>
            </div>
          );
        })}
      </div>
      {sentinelRef && <div ref={sentinelRef} style={{ height: '1px' }} />}
    </div>
  );
};

export default ArtistGrid;
