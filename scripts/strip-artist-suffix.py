#!/usr/bin/env python3
"""Strip a trailing word (default " Version") from the artist tags of mp3s.

Touches TPE1 (artist), TPE2 (album artist), TSOP (artist sort) and TSO2, only
when the value ends with the suffix (case-insensitive, preceded by a space).
Nothing else is modified and the file's ID3v2 version is preserved.

Dry run by default; pass --apply to write.

    python3 scripts/strip-artist-suffix.py DIR            # preview
    python3 scripts/strip-artist-suffix.py DIR --apply    # write
"""
import argparse
import os
import re
import sys

from mutagen.id3 import ID3, ID3NoHeaderError

FRAMES = ('TPE1', 'TPE2', 'TSOP', 'TSO2')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('directory')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--suffix', default='Version')
    args = ap.parse_args()
    pat = re.compile(r'\s+' + re.escape(args.suffix) + r'\s*$', re.IGNORECASE)

    files = changed = 0
    seen = {}
    for root, _, names in sorted(os.walk(args.directory)):
        for name in sorted(names):
            if not name.lower().endswith('.mp3'):
                continue
            files += 1
            path = os.path.join(root, name)
            try:
                tags = ID3(path)
            except ID3NoHeaderError:
                continue
            dirty = False
            for key in FRAMES:
                for fr in tags.getall(key):
                    new = [pat.sub('', v) for v in fr.text]
                    if new != list(fr.text):
                        for old, n in zip(fr.text, new):
                            seen[(key, old)] = n
                        fr.text = new
                        dirty = True
            if dirty:
                changed += 1
                if args.apply:
                    version = tags.version[1] if tags.version[1] in (3, 4) else 4
                    tags.save(v2_version=version)

    for (key, old), new in sorted(seen.items()):
        print('%s: %r -> %r' % (key, old, new))
    verb = 'retagged' if args.apply else 'would retag'
    print('\n%s %d of %d mp3(s)' % (verb, changed, files), file=sys.stderr)
    if not args.apply and changed:
        print('dry run: re-run with --apply to write', file=sys.stderr)


if __name__ == '__main__':
    main()
