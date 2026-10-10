#!/usr/bin/env python3
"""Retag mp3s whose artist is a placeholder (default "Time Life") and whose
title is "<artist> / <title>": move the performer into the artist tag and
leave the real title.

Dry run by default; pass --apply to write. Only the TPE1 (artist) and TIT2
(title) frames change; album, album artist, track number, art etc. are left
alone, and the file's ID3v2 version is preserved.

    python3 scripts/retag-artist-from-title.py DIR            # preview
    python3 scripts/retag-artist-from-title.py DIR --apply    # write
"""
import argparse
import os
import sys

from mutagen.id3 import ID3, ID3NoHeaderError, TIT2, TPE1

SEP = ' / '


def plan(path, placeholder):
    """Return (new_artist, new_title) or None if the file should be skipped."""
    try:
        tags = ID3(path)
    except ID3NoHeaderError:
        return None
    artist = str(tags['TPE1']) if 'TPE1' in tags else ''
    title = str(tags['TIT2']) if 'TIT2' in tags else ''
    if artist.strip() != placeholder or SEP not in title:
        return None
    new_artist, new_title = (s.strip() for s in title.split(SEP, 1))
    if not new_artist or not new_title:
        return None
    return new_artist, new_title


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('directory')
    ap.add_argument('--apply', action='store_true', help='write changes (default is a dry run)')
    ap.add_argument('--placeholder', default='Time Life', help='artist value that marks a file for retagging')
    args = ap.parse_args()

    changed = skipped = 0
    for root, _, files in sorted(os.walk(args.directory)):
        for name in sorted(files):
            if not name.lower().endswith('.mp3'):
                continue
            path = os.path.join(root, name)
            result = plan(path, args.placeholder)
            if result is None:
                skipped += 1
                continue
            new_artist, new_title = result
            print(f'{os.path.relpath(path, args.directory)}\n    artist: {args.placeholder!r} -> {new_artist!r}\n    title:  {new_title!r}')
            if args.apply:
                tags = ID3(path)
                version = tags.version[1] if tags.version[1] in (3, 4) else 4
                tags.setall('TPE1', [TPE1(encoding=3, text=[new_artist])])
                tags.setall('TIT2', [TIT2(encoding=3, text=[new_title])])
                tags.save(v2_version=version)
            changed += 1

    verb = 'retagged' if args.apply else 'would retag'
    print(f'\n{verb} {changed} file(s), skipped {skipped}', file=sys.stderr)
    if not args.apply and changed:
        print('dry run: re-run with --apply to write', file=sys.stderr)


if __name__ == '__main__':
    main()
