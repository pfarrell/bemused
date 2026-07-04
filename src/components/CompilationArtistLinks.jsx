import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VISIBLE_COUNT = 15;

const CompilationArtistLinks = ({ artists = [] }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? artists : artists.slice(0, VISIBLE_COUNT);
  const hiddenCount = artists.length - VISIBLE_COUNT;

  return (
    <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal', margin: '0 0 0.5rem 0', color: '#7c3aed' }}>
      {visible.map((a, i) => (
        <span key={a.id}>
          {i > 0 && ', '}
          <span style={{ cursor: 'pointer' }} onClick={() => navigate(`/artist/${a.id}`)}>
            {a.name}
          </span>
        </span>
      ))}
      {!expanded && hiddenCount > 0 && (
        <span
          style={{ cursor: 'pointer', color: '#6b7280', fontSize: '1rem', marginLeft: '0.5rem' }}
          onClick={() => setExpanded(true)}
        >
          + {hiddenCount} more
        </span>
      )}
    </h2>
  );
};

export default CompilationArtistLinks;
