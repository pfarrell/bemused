import { useTouchScroll } from './useTouchScroll';
import QuickHitTab from './QuickHitTab';
import { useProfileFilterStore } from '../stores/profileFilterStore';

// The Recent drawer: recently played albums, playlists and collections mixed
// by time, in the left-hand slot the tracks/playlist panels use (they are
// mutually exclusive with it - see JukeboxBrowsePanel.jsx). A sibling of the
// scrolling browse drawer rather than a child, for the same reason as the
// tracks panel: drags inside it must not bubble to the drawer's scroll handler.
const JukeboxRecentsPanel = ({ onClose, onSelectAlbum, onSelectPlaylist, onSelectCollection }) => {
  const scrollRef = useTouchScroll({ axis: 'y' });
  const activeProfileId = useProfileFilterStore((s) => s.activeProfileId);

  return (
    <div className="jukebox-tracks-panel jukebox-recents-panel">
      <div className="jukebox-tracks-panel-header">
        <div className="jukebox-tracks-panel-top">
          <h2 className="jukebox-drill-title">Recent</h2>
          <button type="button" className="jukebox-tracks-panel-close" aria-label="Close recent" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="jukebox-tracks-panel-body" ref={scrollRef}>
        <QuickHitTab
          onSelectAlbum={onSelectAlbum}
          onSelectPlaylist={onSelectPlaylist}
          onSelectCollection={onSelectCollection}
          profileId={activeProfileId}
        />
      </div>
    </div>
  );
};

export default JukeboxRecentsPanel;
