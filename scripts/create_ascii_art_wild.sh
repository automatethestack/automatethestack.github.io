#!/bin/bash

set -euo pipefail

FRAME_DIR="scripts/frames"
ASCII_TXT_DIR="scripts/ascii_frames"

mkdir -p "$ASCII_TXT_DIR"

shopt -s nullglob
frames=("$FRAME_DIR"/frame_*.png)
count=${#frames[@]}
if (( count == 0 )); then
  echo "No frames found in $FRAME_DIR" >&2
  exit 1
fi

echo "Converting $count frames to ASCII (wild charset, --wide width=420 where requested)"

i=0
for png in "${frames[@]}"; do
  ((i++))
  base=$(basename "$png" .png)
  out="$ASCII_TXT_DIR/${base}.txt"
  # Use --wide to produce 420 width frames suitable for the web layout
  lua scripts/ascii_wild.lua "$png" "$out" --wide
  printf "Processed %d/%d\r" "$i" "$count"
done
echo -e "\nDone: $ASCII_TXT_DIR"


