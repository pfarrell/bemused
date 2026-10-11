const SOURCE_LABELS = {
  discogs: 'Discogs',
  wikidata: 'Wikidata',
  bandcamp: 'Bandcamp',
  allmusic: 'AllMusic',
  other: 'Link',
};

const KIND_LABELS = { release: 'release', master: 'master', artist: 'artist' };

export const externalLinkLabel = (link) => {
  const source = SOURCE_LABELS[link.source] || link.source;
  const kind = link.source === 'discogs' ? KIND_LABELS[link.kind] : null;
  if (link.source === 'other') {
    try {
      return new URL(link.url).hostname.replace(/^www\./, '');
    } catch {
      return source;
    }
  }
  return kind ? `${source} (${kind})` : source;
};
