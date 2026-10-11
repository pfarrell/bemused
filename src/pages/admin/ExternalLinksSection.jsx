import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { externalLinkLabel } from '../../utils/externalLinkLabels';
import AdminPanel from '../../components/admin/AdminPanel';
import RelationList from '../../components/admin/RelationList';

// Links to Discogs and other sources MusicBrainz/Wikipedia don't cover.
// Paste a URL; a bare Discogs id also works when the kind is chosen.
const ExternalLinksSection = ({ entityType, entityId }) => {
  const [links, setLinks] = useState([]);
  const [input, setInput] = useState('');
  const [kind, setKind] = useState(entityType === 'album' ? 'release' : 'artist');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiService.getExternalLinks(entityType, entityId);
        if (!cancelled) setLinks(response.data);
      } catch (err) {
        console.error('Error loading external links:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [entityType, entityId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSaving(true);
    setError('');
    try {
      const response = await apiService.addExternalLink(entityType, entityId, input.trim(), { source: 'discogs', kind });
      setLinks(response.data);
      setInput('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add link'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (link) => {
    if (!window.confirm('Remove this link?')) return;
    try {
      await apiService.deleteExternalLink(link.id);
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to remove link'));
    }
  };

  const kinds = entityType === 'album' ? ['release', 'master'] : ['artist'];

  return (
    <AdminPanel tone="relations" title="External Links">
      <RelationList
        title=""
        items={links}
        renderName={(link) => (
          <a href={link.url} target="_blank" rel="noopener noreferrer">{externalLinkLabel(link)}</a>
        )}
        renderMeta={(link) => <small>{link.source === 'discogs' ? link.external_id : link.url}</small>}
        onRemove={handleRemove}
      />
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a Discogs, Wikidata, Bandcamp or other URL"
          aria-label="External link URL or Discogs id"
          style={{ flex: '1 1 18rem' }}
        />
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Discogs id kind">
          {kinds.map((k) => <option key={k} value={k}>Discogs {k} id</option>)}
        </select>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !input.trim()}>Add link</button>
      </form>
      {error && <p role="alert" style={{ color: 'var(--color-danger, #c00)' }}>{error}</p>}
    </AdminPanel>
  );
};

export default ExternalLinksSection;
