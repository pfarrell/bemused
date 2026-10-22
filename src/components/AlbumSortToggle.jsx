// src/components/AlbumSortToggle.jsx
import { useAlbumSortStore } from '../stores/albumSortStore';

const OPTIONS = [
  { value: 'newest', label: 'Newest', ariaLabel: 'Sort newest first' },
  { value: 'oldest', label: 'Oldest', ariaLabel: 'Sort oldest first' },
  { value: 'alpha', label: 'A–Z', ariaLabel: 'Sort alphabetically' },
];

// Same light-surface pill as PlaylistSortToggle, with a third option.
const AlbumSortToggle = () => {
  const { sortBy, setSortBy } = useAlbumSortStore();

  const buttonStyle = (active) => ({
    background: active ? '#3b82f6' : 'none',
    color: active ? 'white' : 'var(--color-text-muted)',
    padding: '0.375rem 0.75rem',
    borderRadius: '18px',
    fontSize: '0.8125rem',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
  });

  return (
    <div style={{ display: 'inline-flex', background: 'var(--color-bg-surface-muted)', borderRadius: '20px', padding: '3px', gap: '2px' }}>
      {OPTIONS.map(({ value, label, ariaLabel }) => (
        <button
          key={value}
          type="button"
          aria-label={ariaLabel}
          aria-pressed={sortBy === value}
          onClick={() => setSortBy(value)}
          style={buttonStyle(sortBy === value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default AlbumSortToggle;
