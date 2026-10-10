#!/usr/bin/env python3
"""Make track numbers continuous across discs, using the disc in the filename.

For mp3s named "... - D<disc>-<discs> - <track> - ...", each album folder is
treated as one album. A track on disc N gets TRCK = <track in filename> +
(sum of the highest track number on each earlier disc in that folder), so
D2-2 track 01 after a 16-track D1 becomes 17. Disc 1 is left as is. The new
number comes from the filename, so re-running is harmless. Only TRCK changes
(TPOS is untouched), padded to two digits like the existing tags, and the
file's ID3v2 version is preserved. Files without a D<n>-<m> marker (e.g.
"S01T01") are ignored.

Dry run by default; pass --apply to write.

    python3 scripts/offset-disc-tracks.py DIR            # preview
    python3 scripts/offset-disc-tracks.py DIR --apply    # write
"""
import argparse
import collections
import os
import re
import sys

from mutagen.id3 import ID3, ID3NoHeaderError, TRCK

MARK = re.compile(r' - D(\d+)-\d+ - (\d+) - ')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('directory')
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()

    changed = 0
    for root, _, names in sorted(os.walk(args.directory)):
        discs = collections.defaultdict(list)  # disc -> [(track, path)]
        for name in sorted(names):
            m = MARK.search(name) if name.lower().endswith('.mp3') else None
            if m:
                discs[int(m[1])].append((int(m[2]), os.path.join(root, name)))
        if len(discs) < 2:
            continue
        offset = 0
        summary = []
        for disc in sorted(discs):
            tracks = discs[disc]
            for track, path in tracks:
                new = track + offset
                try:
                    tags = ID3(path)
                except ID3NoHeaderError:
                    continue
                if disc > 1 and str(tags.get('TRCK', '')) != '%02d' % new:
                    changed += 1
                    if args.apply:
                        tags.setall('TRCK', [TRCK(encoding=3, text=['%02d' % new])])
                        tags.save(v2_version=tags.version[1] if tags.version[1] in (3, 4) else 4)
            summary.append('D%d: %d track(s), offset +%d' % (disc, len(tracks), offset))
            offset += max(t for t, _ in tracks)
        print('%s: %s' % (os.path.relpath(root, args.directory), '; '.join(summary)))

    verb = 'renumbered' if args.apply else 'would renumber'
    print('\n%s %d file(s)' % (verb, changed), file=sys.stderr)
    if not args.apply and changed:
        print('dry run: re-run with --apply to write', file=sys.stderr)


if __name__ == '__main__':
    main()
