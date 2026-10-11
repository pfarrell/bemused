import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { externalLinkLabel } from '../utils/externalLinkLabels';

// Outside-source links (Discogs, Wikidata, ...) for an album or artist.
// Renders nothing when there are none, or if the lookup fails.
const ExternalLinks = ({ entityType, entityId }) => {
  const [links, setLinks] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiService.getExternalLinks(entityType, entityId);
        if (!cancelled) setLinks(Array.isArray(response?.data) ? response.data : []);
      } catch {
        if (!cancelled) setLinks([]);
      }
    })();
    return () => { cancelled = true; };
  }, [entityType, entityId]);

  if (links.length === 0) return null;

  return (
    <div className="external-links" style={{ margin: '1rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', alignItems: 'baseline' }}>
      <strong style={{ color: 'var(--color-text-secondary)' }}>Elsewhere:</strong>
      {links.map((link) => (
        <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer">
          {externalLinkLabel(link)}
        </a>
      ))}
    </div>
  );
};

export default ExternalLinks;
