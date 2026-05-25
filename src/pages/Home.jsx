// src/pages/Home.jsx
import { useEffect, useRef } from 'react';
import { useInfiniteItems } from '../hooks/useInfiniteItems';
import { useHomeModeStore } from '../stores/homeModeStore';
import { apiService } from '../services/api';
import ArtistGrid from '../components/ArtistGrid';
import AlbumGrid from '../components/AlbumGrid';
import Loading from '../components/Loading';
import Retry from '../components/Retry';

const HomeFeed = ({ mode }) => {
  const fetchFn = mode === 'albums'
    ? (size) => apiService.getRandomAlbums(size)
    : (size) => apiService.getRandomArtists(size);

  const { items, isLoading, error, loadMore } = useInfiniteItems(fetchFn);
  const gridRef     = useRef(null);
  const sentinelRef = useRef(null);

  // Scroll to top when this feed mounts (i.e. on mode switch)
  useEffect(() => {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }, []);

  // Initial load
  useEffect(() => {
    loadMore(gridRef);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll: re-run when items.length changes so the observer
  // picks up the real sentinel after the initial <Loading> unmounts.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore(gridRef);
      },
      {
        root: document.querySelector('.main-content'),
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, items.length]);

  if (items.length === 0 && isLoading) {
    return <Loading message={`Loading ${mode}`} />;
  }

  if (error && items.length === 0) {
    return <Retry error={error} />;
  }

  return (
    <>
      {mode === 'albums'
        ? <AlbumGrid albums={items} gridRef={gridRef} sentinelRef={sentinelRef} />
        : <ArtistGrid artists={items} imageContext="artist_search" gridRef={gridRef} sentinelRef={sentinelRef} />
      }
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="loading-spinner" />
        </div>
      )}
    </>
  );
};

const Home = () => {
  const { mode } = useHomeModeStore();
  return <HomeFeed key={mode} mode={mode} />;
};

export default Home;
