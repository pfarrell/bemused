// src/pages/Collection.jsx
import { useEffect, useState } from 'react';
import ImageLightbox from '../components/ImageLightbox';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import AlbumCard from '../components/AlbumCard';
import AlbumStubCard from '../components/AlbumStubCard';
import Loading from '../components/Loading';
import Retry from '../components/Retry';
import NotesSection from '../components/NotesSection';
import AboutSection from '../components/AboutSection';
import PlayActionsMenu from '../components/PlayActionsMenu';
import CoverCollage from '../components/CoverCollage';
import ContextMenu from '../components/ContextMenu';
import CardGrid from '../components/CardGrid';
import { useContextMenu } from '../hooks/useContextMenu';
import { useFavoritesStore } from '../stores/favoritesStore';
import { usePlayerStore } from '../stores/playerStore';
import { shareLink } from '../utils/shareLink';

export default function Collection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated } = useAuthStore();
  const [collectionData, setCollectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const isFavorite = useFavoritesStore((s) => s.isFavorite('collection', parseInt(id)));
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const startScopeShuffle = usePlayerStore((s) => s.startScopeShuffle);
  const [shuffleLoading, setShuffleLoading] = useState(false);
  const ctxMenu = useContextMenu({ shouldIgnore: (e) => !isAuthenticated || e.target.tagName === 'A' || !!e.target.closest('button') });

  const handleShuffleAll = async () => {
    setShuffleLoading(true);
    try {
      await startScopeShuffle('collection', collectionData.collection.id);
    } finally {
      setShuffleLoading(false);
    }
  };

  const handleToggleFavorite = () => {
    if (!collectionData?.collection) return;
    const { collection: c } = collectionData;
    toggleFavorite('collection', c.id, { id: c.id, name: c.name, image_path: c.image_path, album_count: collectionData.albums?.length });
    ctxMenu.close();
  };

  useEffect(() => {
    loadCollection();
  }, [id]);

  const loadCollection = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCollection(id);
      setCollectionData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <Retry message={error} onRetry={loadCollection} />;
  if (!collectionData) return <div>Collection not found</div>;

  const { collection, albums, stubs, notes, summary } = collectionData;
  const canEdit = isAdmin || (user && collection.user_id === user.id);

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--color-bg-surface-muted)', minHeight: '100%' }}>
      {/* Collection Header */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '2rem',
          backgroundColor: 'var(--color-bg-surface)',
          padding: '2rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}
        {...ctxMenu.triggerProps}
      >
        {/* Collection Image */}
        <div style={{ flexShrink: 0, width: '200px', height: '200px', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <CoverCollage
            imagePath={collection.image_path}
            items={albums}
            alt={collection.name}
            onImageClick={collection.image_path ? () => setShowImageModal(true) : undefined}
            placeholderGlyph="▣"
            imageContext="album_page"
          />
        </div>

        {/* Collection Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>
              {collection.name}
            </h1>
          </div>

          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            {albums?.length || 0} {albums?.length === 1 ? 'album' : 'albums'}
          </p>

          <PlayActionsMenu
            onPlay={albums?.length > 0 ? handleShuffleAll : undefined}
            disabled={shuffleLoading}
            overflowActions={[
              canEdit && { key: 'edit', icon: '✎', label: 'Edit', onClick: () => navigate(`/admin/collection/${id}`) },
              isAuthenticated && {
                key: 'favorite',
                icon: isFavorite ? '★' : '☆',
                label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
                onClick: handleToggleFavorite,
              },
              isAuthenticated && { key: 'share', icon: '📤', label: 'Share', onClick: () => shareLink({ title: collection.name, text: `${collection.name} collection` }) },
            ].filter(Boolean)}
          />

          <AboutSection heading="About this collection" summary={summary} />
        </div>
      </div>

      <ContextMenu
        open={ctxMenu.open}
        position={ctxMenu.position}
        onDismiss={ctxMenu.dismiss}
        onSwallowTouch={ctxMenu.swallowTouch}
        testId="collection-header-menu-backdrop"
      >
        {canEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); ctxMenu.close(); navigate(`/admin/collection/${id}`); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); ctxMenu.close(); navigate(`/admin/collection/${id}`); }}
          >
            ✎ Edit
          </button>
        )}
        {isAuthenticated && (
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFavorite(); }}
          >
            {isFavorite ? '★ Remove from Favorites' : '☆ Add to Favorites'}
          </button>
        )}
        {isAuthenticated && (
          <button
            onClick={(e) => { e.stopPropagation(); ctxMenu.close(); shareLink({ title: collection.name, text: `${collection.name} collection` }); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); ctxMenu.close(); shareLink({ title: collection.name, text: `${collection.name} collection` }); }}
          >
            📤 Share
          </button>
        )}
      </ContextMenu>

      {showImageModal && collection.image_path && (
        <ImageLightbox
          imageUrl={apiService.getImageUrl(collection.image_path, 'album_page')}
          alt={collection.name}
          title={collection.name}
          onClose={() => setShowImageModal(false)}
        />
      )}

      {/* Albums Grid */}
      {(albums?.length > 0 || stubs?.length > 0) ? (
        <div className="artist-grid">
          <CardGrid>
            {[
              ...(albums || []).map((album) => ({ type: 'album', order: album.order ?? 0, data: album })),
              ...(stubs || []).map((stub) => ({ type: 'stub', order: stub.order ?? 0, data: stub })),
            ]
              .sort((a, b) => a.order - b.order)
              .map((item) => item.type === 'album' ? (
                <AlbumCard
                  key={`album-${item.data.id}`}
                  album={item.data}
                  artist={item.data.artist}
                  imageUrl={apiService.getImageUrl(item.data.image_path, 'album_small')}
                  onClick={() => navigate(`/album/${item.data.id}`, { state: { collectionId: collection.id } })}
                  collectionId={collection.id}
                />
              ) : (
                <AlbumStubCard key={`stub-${item.data.id}`} stub={item.data} />
              ))}
          </CardGrid>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--color-text-muted)'
        }}>
          This collection is empty
        </div>
      )}

      <NotesSection entityType="collection" entityId={parseInt(id)} notes={notes || []} isLoggedIn={isAuthenticated} onChange={loadCollection} />
    </div>
  );
}
