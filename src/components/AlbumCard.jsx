import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AddToCollectionModal from './AddToCollectionModal';

const AlbumCard = ({ album, artist, onClick, imageUrl, fullImageUrl }) => {
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const longPressTimer = useRef(null);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  const handleImageClick = (e) => {
    if (fullImageUrl) {
      e.stopPropagation();
      setShowModal(true);
    }
  };

  const openDropdown = (x, y) => {
    const menuWidth = 200;
    const menuHeight = 60;
    let px = x;
    let py = y;
    if (px + menuWidth > window.innerWidth) px = window.innerWidth - menuWidth - 10;
    if (px < 10) px = 10;
    if (py + menuHeight > window.innerHeight) py = Math.max(10, y - menuHeight - 10);
    setDropdownPos({ x: px, y: py });
    setShowDropdown(true);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openDropdown(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    if (showDropdown) return;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressTimer.current = setTimeout(() => {
      const x = isMobile
        ? Math.max(10, touchStartPos.current.x - 100)
        : touchStartPos.current.x;
      openDropdown(x, touchStartPos.current.y);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchMove = (e) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    }
  };

  const handleTouchEnd = (e) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (showDropdown) { e.preventDefault(); e.stopPropagation(); }
  };

  return (
    <>
      <div
        className="artist-card"
        onClick={() => !showDropdown && onClick(album)}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="artist-card-image">
          <img
            src={imageUrl}
            alt={`${album.title}, ${artist.name}`}
            onClick={handleImageClick}
            style={{ cursor: fullImageUrl ? 'zoom-in' : 'pointer' }}
            onError={(e) => {
              if (e.target.src.includes('/sm/')) {
                e.target.src = e.target.src.replace('/sm/', '/');
                e.target.onerror = null;
              }
            }}
          />
        </div>
        <div className="artist-card-title">
          <h3>{album.title}</h3>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0', cursor: 'pointer' }}>
            {artist.name}
          </p>
        </div>
      </div>

      {/* Right-click / long-press dropdown */}
      {showDropdown && createPortal(
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 50 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDropdown(false); }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setShowDropdown(false); }}
          />
          <div style={{
            position: 'fixed',
            left: `${dropdownPos.x}px`,
            top: `${dropdownPos.y}px`,
            zIndex: 100,
            backgroundColor: 'white',
            borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            minWidth: '180px',
            overflow: 'hidden',
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDropdown(false); setShowCollectionModal(true); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setShowDropdown(false); setShowCollectionModal(true); }}
              style={{
                width: '100%', textAlign: 'left', padding: '0.75rem 1rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.875rem', color: '#1f2937',
                minHeight: '44px', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ▣ Add to Collection
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Zoom modal */}
      {showModal && createPortal(
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out', padding: '1rem',
          }}
        >
          <img
            src={fullImageUrl}
            alt={`${album.title}, ${artist.name}`}
            style={{
              maxWidth: '90vw', maxHeight: '80vh',
              objectFit: 'contain', borderRadius: '4px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
            onError={(e) => { e.target.src = imageUrl; }}
          />
          <div style={{ marginTop: '0.75rem', textAlign: 'center', color: 'white' }}>
            <div style={{ fontWeight: '600', fontSize: '1rem' }}>{album.title}</div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.25rem' }}>{artist.name}</div>
          </div>
        </div>,
        document.body
      )}

      {/* Add to collection modal */}
      {showCollectionModal && (
        <AddToCollectionModal
          album={album}
          onClose={() => setShowCollectionModal(false)}
        />
      )}
    </>
  );
};

export default AlbumCard;
