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
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [coverBusy, setCoverBusy] = useState(null);

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

  const handleSearch = async () => {
    setSearching(true);
    setError('');
    setMessage('');
    try {
      const response = await apiService.searchDiscogs(entityType, entityId, searchQuery.trim());
      setResults(response.data.results);
    } catch (err) {
      setResults(null);
      setError(getErrorMessage(err, 'Discogs search failed'));
    } finally {
      setSearching(false);
    }
  };

  const handleLinkResult = async (result) => {
    setError('');
    try {
      const response = await apiService.addExternalLink(entityType, entityId, String(result.id), { source: 'discogs', kind: result.kind });
      setLinks(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add link'));
    }
  };

  const handleUseCover = async (link) => {
    setCoverBusy(link.id);
    setError('');
    setMessage('');
    try {
      await apiService.fetchDiscogsCover(entityId, link.id);
      setMessage('Cover saved. Reload the page to see it in the Images section.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch the Discogs cover'));
    } finally {
      setCoverBusy(null);
    }
  };

  const linkedKeys = new Set(links.filter((l) => l.source === 'discogs').map((l) => `${l.kind}:${l.external_id}`));

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
        rowActions={(link) =>
          entityType === 'album' && link.source === 'discogs' && link.kind !== 'artist' ? (
            <button type="button" className="btn btn-secondary btn-sm" disabled={coverBusy === link.id} onClick={() => handleUseCover(link)}>
              {coverBusy === link.id ? 'Fetching...' : 'Use cover'}
            </button>
          ) : null
        }
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
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
          placeholder={`Search Discogs (blank = this ${entityType}'s ${entityType === 'album' ? 'artist and title' : 'name'})`}
          aria-label="Discogs search text"
          style={{ flex: '1 1 18rem' }}
        />
        <button type="button" className="btn btn-secondary btn-sm" disabled={searching} onClick={handleSearch}>
          {searching ? 'Searching...' : 'Find on Discogs'}
        </button>
      </div>
      {results && results.length === 0 && <p>No Discogs matches.</p>}
      {results && results.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0' }}>
          {results.map((r) => (
            <li key={`${r.kind}-${r.id}`} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.25rem 0' }}>
              {r.thumb && <img src={r.thumb} alt="" width="40" height="40" style={{ objectFit: 'cover' }} />}
              <span style={{ flex: 1 }}>
                <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>
                <small style={{ display: 'block', color: 'var(--color-text-muted)' }}>
                  {[r.kind, r.year, r.country, r.label, r.format].filter(Boolean).join(' · ')}
                </small>
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={linkedKeys.has(`${r.kind}:${r.id}`)}
                onClick={() => handleLinkResult(r)}
              >
                {linkedKeys.has(`${r.kind}:${r.id}`) ? 'Linked' : 'Link'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" style={{ color: 'var(--color-danger, #c00)' }}>{error}</p>}
    </AdminPanel>
  );
};

export default ExternalLinksSection;
