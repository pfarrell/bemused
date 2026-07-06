import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import TrackArtistPicker from './TrackArtistPicker';

const fieldChanged = (field) => field.current !== field.proposed;

const ReprocessAlbumModal = ({ albumId, onClose, onApplied }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [albumValues, setAlbumValues] = useState({});
  const [albumChecked, setAlbumChecked] = useState({});
  const [trackValues, setTrackValues] = useState({});
  const [trackChecked, setTrackChecked] = useState({});
  const [artistNames, setArtistNames] = useState({});
  const [artistChecked, setArtistChecked] = useState({});
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiService.getReprocessPreview(albumId)
      .then((response) => {
        if (cancelled) return;
        const data = response.data;
        setPreview(data);

        const initialAlbumValues = {};
        const initialAlbumChecked = {};
        Object.entries(data.album.fields).forEach(([key, field]) => {
          initialAlbumValues[key] = field.proposed;
          initialAlbumChecked[key] = fieldChanged(field);
        });
        setAlbumValues(initialAlbumValues);
        setAlbumChecked(initialAlbumChecked);

        const initialTrackValues = {};
        const initialTrackChecked = {};
        const initialArtistNames = {};
        const initialArtistChecked = {};
        data.tracks.forEach((track) => {
          initialTrackValues[track.id] = {};
          initialTrackChecked[track.id] = {};
          Object.entries(track.fields).forEach(([key, field]) => {
            initialTrackValues[track.id][key] = field.proposed;
            initialTrackChecked[track.id][key] = fieldChanged(field);
          });
          if (track.artist) {
            initialArtistNames[track.id] = track.artist.matched_artist
              ? track.artist.matched_artist.name
              : track.artist.proposed_name;
            initialArtistChecked[track.id] = track.artist.proposed_name !== track.artist.current?.name;
          }
        });
        setTrackValues(initialTrackValues);
        setTrackChecked(initialTrackChecked);
        setArtistNames(initialArtistNames);
        setArtistChecked(initialArtistChecked);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || 'Failed to load preview');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [albumId]);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">Loading preview…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <p>{error}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const handleApply = async () => {
    setApplying(true);
    setError(null);
    try {
      const albumPayload = {};
      Object.entries(albumChecked).forEach(([key, checked]) => {
        if (checked) albumPayload[key] = albumValues[key];
      });

      const trackPayload = preview.tracks.map((track) => {
        const entry = { id: track.id };
        Object.entries(trackChecked[track.id] || {}).forEach(([key, checked]) => {
          if (checked) entry[key] = trackValues[track.id][key];
        });
        if (track.artist && artistChecked[track.id]) {
          entry.artist_name = artistNames[track.id];
        }
        return entry;
      }).filter((entry) => Object.keys(entry).length > 1);

      await apiService.applyReprocess(albumId, { album: albumPayload, tracks: trackPayload });
      onApplied();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to apply changes');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Reprocess Album From Files</h3>

        <table>
          <tbody>
            <tr>
              <td>
                <input
                  type="checkbox"
                  checked={!!albumChecked.title}
                  onChange={(e) => setAlbumChecked({ ...albumChecked, title: e.target.checked })}
                />
              </td>
              <td>Title</td>
              <td>
                <input
                  type="text"
                  value={albumValues.title || ''}
                  onChange={(e) => setAlbumValues({ ...albumValues, title: e.target.value })}
                />
              </td>
            </tr>
            <tr>
              <td>
                <input
                  type="checkbox"
                  checked={!!albumChecked.release_year}
                  onChange={(e) => setAlbumChecked({ ...albumChecked, release_year: e.target.checked })}
                />
              </td>
              <td>Year</td>
              <td>
                <input
                  type="number"
                  value={albumValues.release_year ?? ''}
                  onChange={(e) => setAlbumValues({ ...albumValues, release_year: e.target.value })}
                />
              </td>
            </tr>
          </tbody>
        </table>

        <table>
          <tbody>
            {preview.tracks.map((track) => (
              <tr key={track.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={!!trackChecked[track.id]?.title}
                    onChange={(e) => setTrackChecked({
                      ...trackChecked,
                      [track.id]: { ...trackChecked[track.id], title: e.target.checked },
                    })}
                  />
                  <input
                    type="text"
                    value={trackValues[track.id]?.title || ''}
                    onChange={(e) => setTrackValues({
                      ...trackValues,
                      [track.id]: { ...trackValues[track.id], title: e.target.value },
                    })}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!trackChecked[track.id]?.track_number}
                    onChange={(e) => setTrackChecked({
                      ...trackChecked,
                      [track.id]: { ...trackChecked[track.id], track_number: e.target.checked },
                    })}
                  />
                  <input
                    type="number"
                    value={trackValues[track.id]?.track_number ?? ''}
                    onChange={(e) => setTrackValues({
                      ...trackValues,
                      [track.id]: { ...trackValues[track.id], track_number: e.target.value },
                    })}
                  />
                </td>
                {track.artist && (
                  <td>
                    <input
                      type="checkbox"
                      checked={!!artistChecked[track.id]}
                      onChange={(e) => setArtistChecked({ ...artistChecked, [track.id]: e.target.checked })}
                    />
                    <TrackArtistPicker
                      artistName={artistNames[track.id]}
                      onSelect={(_id, name) => setArtistNames({ ...artistNames, [track.id]: name })}
                    />
                    {!track.artist.matched_artist && <span> (new artist)</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {preview.skipped.length > 0 && (
          <ul>
            {preview.skipped.map((s) => (
              <li key={s.track_id}>Track {s.track_id}: {s.reason}</li>
            ))}
          </ul>
        )}

        {error && <p>{error}</p>}

        <button onClick={onClose} disabled={applying}>Cancel</button>
        <button onClick={handleApply} disabled={applying}>
          {applying ? 'Applying…' : 'Apply'}
        </button>
      </div>
    </div>
  );
};

export default ReprocessAlbumModal;
