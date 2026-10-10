#!/usr/bin/env python3
"""Fix cue sheets where the performer is encoded in the track title.

For each TRACK whose PERFORMER is the placeholder (default "Time Life") and
whose TITLE is "<artist> / <title>", set PERFORMER to <artist> and TITLE to
<title>. Everything else in the file is untouched, including its encoding
(EAC writes UTF-16LE with a BOM), BOM, and line endings. The original is
saved once as <name>.cue.bak before the first rewrite.

Dry run by default; pass --apply to write.

    python3 scripts/fix-cue-performers.py DIR_OR_CUE [...]           # preview
    python3 scripts/fix-cue-performers.py DIR_OR_CUE [...] --apply   # write
"""
import argparse
import os
import re
import shutil
import sys

SEP = ' / '
PERF_RE = re.compile(r'^(\s*PERFORMER\s+)(.*?)(\s*)$')
TITLE_RE = re.compile(r'^(\s*TITLE\s+)(.*?)(\s*)$')


def read_cue(path):
    raw = open(path, 'rb').read()
    if raw[:2] in (b'\xff\xfe', b'\xfe\xff'):
        return raw.decode('utf-16'), 'utf-16'
    if raw[:3] == b'\xef\xbb\xbf':
        return raw.decode('utf-8-sig'), 'utf-8-sig'
    return raw.decode('utf-8'), 'utf-8'


def unquote(v):
    return v[1:-1] if len(v) >= 2 and v[0] == v[-1] == '"' else v


def quote(v):
    return '"%s"' % v


def fix_text(text, placeholder):
    """Return (new_text, [(old_title, artist, title)])."""
    lines = text.split('\n')  # keeps any trailing \r on each line, so CRLF survives
    changes = []
    i = 0
    while i < len(lines):
        if lines[i].strip().startswith('TRACK '):
            end = i + 1
            while end < len(lines) and not lines[end].strip().startswith('TRACK '):
                end += 1
            t_idx = p_idx = None
            for j in range(i + 1, end):
                s = lines[j].strip()
                if s.startswith('TITLE ') and t_idx is None:
                    t_idx = j
                elif s.startswith('PERFORMER ') and p_idx is None:
                    p_idx = j
            if t_idx is not None and p_idx is not None:
                # strip a trailing \r for matching and re-add it after
                cr_t = '\r' if lines[t_idx].endswith('\r') else ''
                cr_p = '\r' if lines[p_idx].endswith('\r') else ''
                tm = TITLE_RE.match(lines[t_idx].rstrip('\r'))
                pm = PERF_RE.match(lines[p_idx].rstrip('\r'))
                title, perf = unquote(tm.group(2)), unquote(pm.group(2))
                if perf.strip() == placeholder and SEP in title:
                    artist, new_title = (s.strip() for s in title.split(SEP, 1))
                    if artist and new_title:
                        lines[t_idx] = tm.group(1) + quote(new_title) + cr_t
                        lines[p_idx] = pm.group(1) + quote(artist) + cr_p
                        changes.append((title, artist, new_title))
            i = end
        else:
            i += 1
    return '\n'.join(lines), changes


def find_cues(paths):
    for p in paths:
        if os.path.isfile(p):
            yield p
        else:
            for root, _, files in sorted(os.walk(p)):
                for f in sorted(files):
                    if f.lower().endswith('.cue'):
                        yield os.path.join(root, f)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('paths', nargs='+')
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--placeholder', default='Time Life')
    args = ap.parse_args()

    total = 0
    for cue in find_cues(args.paths):
        text, enc = read_cue(cue)
        new_text, changes = fix_text(text, args.placeholder)
        if not changes:
            continue
        print('%s: %d track(s)' % (cue, len(changes)))
        for old, artist, title in changes:
            print('    %r -> %r / %r' % (old, artist, title))
        total += len(changes)
        if args.apply:
            bak = cue + '.bak'
            if not os.path.exists(bak):
                shutil.copy2(cue, bak)
            # 'utf-16' on encode writes a BOM + native (LE) order, matching EAC output.
            with open(cue, 'wb') as fh:
                fh.write(new_text.encode(enc))
    print('\n%s %d track(s)' % ('fixed' if args.apply else 'would fix', total), file=sys.stderr)
    if not args.apply and total:
        print('dry run: re-run with --apply to write', file=sys.stderr)


if __name__ == '__main__':
    main()
