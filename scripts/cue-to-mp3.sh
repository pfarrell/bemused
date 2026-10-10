#!/usr/bin/env bash
# Split an album-image FLAC by its cue sheet into tagged 320 kb/s mp3s:
#   cuebreakpoints | shnsplit (encoding via lame)  ->  cuetag  ->  rename
#
# Usage: cue-to-mp3.sh [-o OUTDIR] [-f] DIR_OR_CUE [...]
#   DIR_OR_CUE  a .cue file, or a directory searched recursively for .cue files
#   -o OUTDIR   write mp3s under OUTDIR (mirroring each cue's subdirectory)
#               instead of next to the cue
#   -f          overwrite: re-split even if "01 - *.mp3" already exists
#
# Output files are named "NN - Performer - Title.mp3". A cue is skipped (with a
# message) when its FLAC is missing, when outputs already exist (unless -f), or
# when a directory scan finds several cues for the same FLAC (e.g. a hand-made
# album-fixed.cue next to the original) - pass the cue you want explicitly.
#
# Cue sheets from EAC are UTF-16; cueprint/cuetag need UTF-8, so each cue is
# converted into a temp copy. Your cue files are never modified.
set -euo pipefail

OUT="" FORCE=0
while getopts "o:f" opt; do
  case $opt in
    o) OUT=$OPTARG ;;
    f) FORCE=1 ;;
    *) sed -n '2,17p' "$0"; exit 2 ;;
  esac
done
shift $((OPTIND - 1))
[ $# -ge 1 ] || { sed -n '2,17p' "$0"; exit 2; }

for tool in shnsplit cuebreakpoints cueprint cuetag lame flac iconv mid3v2; do
  command -v "$tool" >/dev/null || { echo "error: '$tool' not found" >&2; exit 1; }
done

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Write a UTF-8, LF, BOM-free copy of a cue sheet to $2.
to_utf8() {
  local bom
  bom=$(head -c2 "$1" | od -An -tx1 | tr -d ' \n')
  case $bom in
    fffe) iconv -f UTF-16LE -t UTF-8 "$1" ;;
    feff) iconv -f UTF-16BE -t UTF-8 "$1" ;;
    *)    cat "$1" ;;
  esac | sed -e '1s/^\xEF\xBB\xBF//' -e 's/\r$//' > "$2"
  # EAC appends a non-standard "; 2072000.000 milliseconds" to the FILE line,
  # which cuetools can't parse; drop it (only on FILE lines).
  sed -i -e '/^[[:space:]]*FILE /s/[[:space:]]*;.*$//' "$2"
}

sanitize() { printf '%s' "$1" | tr '/\\:*?"<>|' '-' | tr -d '\000-\037'; }

# --- collect cues ---------------------------------------------------------
declare -a EXPLICIT=() FOUND=()
declare -A ROOT_OF=()
for arg in "$@"; do
  if [ -f "$arg" ]; then
    EXPLICIT+=("$arg"); ROOT_OF["$arg"]=$(dirname "$arg")
  elif [ -d "$arg" ]; then
    while IFS= read -r -d '' c; do FOUND+=("$c"); ROOT_OF["$c"]=$arg; done \
      < <(find "$arg" -type f -iname '*.cue' -print0 | sort -z)
  else
    echo "warning: $arg not found" >&2
  fi
done

# Map each scanned cue to its FLAC; drop ambiguous ones.
declare -A COUNT=()
declare -A FLAC_OF=()
for c in "${FOUND[@]+"${FOUND[@]}"}" "${EXPLICIT[@]+"${EXPLICIT[@]}"}"; do
  to_utf8 "$c" "$TMP/probe.cue"
  f=$(sed -n 's/^[[:space:]]*FILE[[:space:]]*"\(.*\)"[[:space:]]*[A-Z]*.*$/\1/p' "$TMP/probe.cue" | head -n1)
  FLAC_OF["$c"]="$(dirname "$c")/$f"
  COUNT["${FLAC_OF[$c]}"]=$(( ${COUNT["${FLAC_OF[$c]}"]:-0} + 1 ))
done

declare -a QUEUE=()
for c in "${FOUND[@]+"${FOUND[@]}"}"; do
  if [ "${COUNT[${FLAC_OF[$c]}]}" -gt 1 ]; then
    echo "skip (several cues for one FLAC; pass the one you want explicitly): $c"
  else
    QUEUE+=("$c")
  fi
done
QUEUE+=("${EXPLICIT[@]+"${EXPLICIT[@]}"}")

# --- process --------------------------------------------------------------
done_n=0 skipped=0
for cue in "${QUEUE[@]+"${QUEUE[@]}"}"; do
  flac_file=${FLAC_OF[$cue]}
  cue_dir=$(dirname "$cue")
  if [ ! -f "$flac_file" ]; then
    echo "skip (FLAC not found: $flac_file): $cue"; skipped=$((skipped + 1)); continue
  fi

  if [ -n "$OUT" ]; then
    rel=${cue_dir#"${ROOT_OF[$cue]}"}; rel=${rel#/}
    outdir=${OUT%/}${rel:+/$rel}
  else
    outdir=$cue_dir
  fi
  mkdir -p "$outdir"

  if [ "$FORCE" -eq 0 ] && compgen -G "$outdir/01 - *.mp3" >/dev/null; then
    echo "skip (already has \"01 - *.mp3\"; use -f to redo): $cue"; skipped=$((skipped + 1)); continue
  fi

  echo "== $cue"
  work=$(mktemp -d -p "$TMP")
  to_utf8 "$cue" "$work/album.cue"
  ntracks=$(grep -c '^[[:space:]]*TRACK ' "$work/album.cue")

  # Split + encode straight to 320 kb/s mp3: 01.mp3, 02.mp3, ...
  cuebreakpoints "$work/album.cue" | shnsplit -q -O always -d "$work" -n %02d -t "%n" \
    -o "cust ext=mp3 lame --silent -b 320 - %f" "$flac_file"

  mapfile -t parts < <(find "$work" -maxdepth 1 -name '[0-9][0-9].mp3' | sort)
  if [ "${#parts[@]}" -ne "$ntracks" ]; then
    echo "error: expected $ntracks tracks but got ${#parts[@]} for $cue" >&2; exit 1
  fi

  cuetag "$work/album.cue" "${parts[@]}"

  i=0
  for p in "${parts[@]}"; do
    i=$((i + 1))
    perf=$(cueprint -n "$i" -t '%p' "$work/album.cue")
    title=$(cueprint -n "$i" -t '%t' "$work/album.cue")
    name=$(printf '%02d - %s - %s.mp3' "$i" "$(sanitize "$perf")" "$(sanitize "$title")")
    mv -f "$p" "$outdir/$name"
    echo "   $name"
  done
  done_n=$((done_n + 1))
done

echo "done: $done_n cue(s) converted, $skipped skipped"
