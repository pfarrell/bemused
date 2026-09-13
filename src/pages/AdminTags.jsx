// src/pages/AdminTags.jsx
import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import Loading from '../components/Loading';
import Retry from '../components/Retry';

export default function AdminTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAdminTags();
      setTags(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleDelete = async (tag) => {
    const confirmed = window.confirm(
      `Delete tag "#${tag.name}"? This removes it from ${tag.artist_count} artist(s) and ${tag.album_count} album(s).`
    );
    if (!confirmed) return;

    setDeletingId(tag.id);
    try {
      await apiService.deleteAdminTag(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && !tags.length) return <Loading />;
  if (error) return <Retry message={error} onRetry={loadTags} />;

  const filteredTags = tags.filter((t) => t.name.includes(filterText.trim().toLowerCase()));

  return (
    <div style={{ padding: '2rem', backgroundColor: 'var(--color-bg-surface-muted)', minHeight: '100%' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
          Tags
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          {tags.length.toLocaleString()} tag{tags.length === 1 ? '' : 's'} total
        </p>
      </div>

      <input
        type="text"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        placeholder="filter tags…"
        style={{
          display: 'block',
          marginBottom: '1rem',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          border: '1px solid var(--color-border-strong)',
          borderRadius: '4px',
          backgroundColor: 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          width: '260px',
          maxWidth: '100%',
        }}
      />

      <div style={{
        backgroundColor: 'var(--color-bg-surface)',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Tag
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Artists
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Albums
                </th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No tags found
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr key={tag.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                      #{tag.name}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                      {tag.artist_count}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                      {tag.album_count}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(tag)}
                        disabled={deletingId === tag.id}
                        style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          cursor: deletingId === tag.id ? 'not-allowed' : 'pointer',
                          opacity: deletingId === tag.id ? 0.6 : 1,
                        }}
                      >
                        {deletingId === tag.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
