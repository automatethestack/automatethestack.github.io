# ASCII Animation Pipeline & Scripts

This directory contains the end-to-end pipeline for converting a source video into ASCII art, and exporting either:
- a JSON payload for the web one‑pager, or
- an MP4 video for standalone playback.

For the web one‑pager and GitHub Pages deployment, see the repository root `README.md`.

## Requirements

- FFmpeg (video processing, frame extraction)
- Lua 5.1+ (ASCII conversion)
- Node.js or Bun (JSON generation; optional local dev server)
- Optional for video route:
  - ImageMagick (render ASCII text to images)
  - bc (shell math calculations)

## Pipeline Overview

Two routes are supported:

- Web Animation route: `input.mp4 → [FFmpeg] → PNG frames → [Lua] → ASCII text → [Node.js] → frames.json → Browser`
- Video route: `input.mp4 → [FFmpeg] → PNG frames → [Lua] → ASCII text → [ImageMagick] → ASCII images → [FFmpeg] → ascii_video.mp4`

## Step 1 — Extract PNG frames with FFmpeg

```bash
# from this scripts directory
mkdir -p frames

# Extract frames at 10 FPS; width 420px, keep aspect ratio
ffmpeg -i input.mp4 -vf "fps=10,scale=420:-1" frames/frame_%04d.png
```

- `fps=10`: extract 10 frames per second
- `scale=420:-1`: constrain width to 420px, auto height
- `frame_%04d.png`: 4-digit sequence naming

## Step 2A — Convert PNG frames to ASCII text (Lua)

Two character palettes are available:

- Numerical-only (10 characters: 0–9): `ascii_numerical.lua`
- Extended (427 characters: Latin Extended, Cyrillic, Greek, box-drawing): `ascii_wild.lua`

```bash
# Single frame conversion (numerical palette)
lua ascii_numerical.lua frames/frame_0001.png ascii_frames/frame_0001.txt

# Single frame conversion (extended palette)
lua ascii_wild.lua frames/frame_0001.png ascii_frames/frame_0001.txt
```

Defaults target ~70 columns of output unless modified in the Lua scripts.

## Step 2B — Batch ASCII generation (shell helpers)

```bash
# Numerical palette, default width (~70 cols)
./create_ascii_art.sh

# Extended palette, web-width (420 columns) variant
./create_ascii_art_wild.sh
```

What these scripts do:
- Validate inputs and directories
- Create `ascii_frames/`
- Process all PNG frames to `.txt` ASCII frames

## Step 3A — Build JSON for the web one‑pager

```bash
# Convert ascii_frames/*.txt → frames.json
node create_json_ascii.js

# Move JSON where the web app expects it
mv frames.json ../public/frames-70-char.json
```

Output structure (abbreviated):
```javascript
[
  ["line1", "line2", "line3", ...],  // Frame 1
  ["line1", "line2", "line3", ...],  // Frame 2
  // ...
]
```

Typical output size: ~850KB for ~600 frames at 10 FPS.

## Step 3B — Render a standalone MP4 video

```bash
# One-step helper: converts frames to ASCII, renders to images, then encodes MP4
./create_ascii_video.sh

# Output: ascii_video.mp4
```

Video configuration is controlled inside the script (frame rate, font, colors, etc.).

## Quick Start

### Web Animation (JSON) route

```bash
cd scripts

# 1) Extract frames
ffmpeg -i input.mp4 -vf "fps=10,scale=420:-1" frames/frame_%04d.png

# 2) Generate ASCII frames
./create_ascii_art.sh            # or ./create_ascii_art_wild.sh

# 3) Create JSON and move to public
node create_json_ascii.js
mv frames.json ../public/frames-70-char.json
```

Then open the site (see root README for options).

### Standalone MP4 route

```bash
cd scripts
./create_ascii_video.sh
# Output: ascii_video.mp4
```

## Configuration Tips

- Output size: change `scale=420:-1` (wider → more detail → larger files)
- Character set: edit `local chars = {...}` in the Lua scripts; order matters (light → dark)
- FPS trade-offs: 10 FPS is a good balance; 5 FPS is smaller; 30 FPS is smoother and larger

## Local Dev Server (optional; local only)

A tiny Bun server is provided for convenience during local iteration. Do not deploy it; GitHub Pages serves static files directly.

File: `scripts/server.local.js`

```bash
# start
yarn bun --hot scripts/server.local.js || bun --hot scripts/server.local.js

# stop (macOS/Linux)
pkill -f "bun --hot scripts/server.local.js" || true
```

## Scripts Directory Structure

```
scripts/
├── server.local.js          # Local dev server (do not deploy)
├── create_json_ascii.js     # Combine ASCII text frames → frames.json
├── ascii_numerical.lua      # ASCII converter (10 chars)
├── ascii_wild.lua           # ASCII converter (427 chars)
├── create_ascii_art.sh      # Batch text generation (numerical)
├── create_ascii_art_wild.sh # Batch text generation (extended; width=420)
├── create_ascii_video.sh    # Full video pipeline
├── input.mp4                # Source video (you provide)
├── frames/                  # PNG frames (generated)
└── ascii_frames/            # ASCII text frames (generated)
```

## Attribution

Pipeline methodology adapted from: `https://transloadit.com/devtips/create-ascii-art-from-videos-with-lua-and-ffmpeg/`