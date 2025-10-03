# Automate The Stack - ASCII Animation Pipeline

This project converts video content into ASCII art animations for display on the web. The pipeline supports two output formats: JSON for web frontend animation, or MP4 video for standalone playback.

## Project Attribution

Pipeline methodology adapted from: https://transloadit.com/devtips/create-ascii-art-from-videos-with-lua-and-ffmpeg/

## ASCII Art Generation Pipeline

### Step 1: Generate PNG Frames from Video

Extract individual frames from your source video using FFmpeg.

```bash
cd scripts

# Create frames directory
mkdir -p frames

# Extract frames at 10 FPS, scaled to 420px width (height auto-calculated)
ffmpeg -i input.mp4 -vf "fps=10,scale=420:-1" frames/frame_%04d.png
```

**Parameters:**
- `fps=10` - Extract 10 frames per second
- `scale=420:-1` - Scale to 420px width, maintain aspect ratio
- `frame_%04d.png` - Output with 4-digit padding (frame_0001.png, frame_0002.png, etc.)

### Step 2A: Convert PNG Frames to ASCII Art (Text Files)

Convert each PNG frame to ASCII art using one of two Lua scripts:

#### Option 1: Numerical Characters (Simple, 10 characters)
Uses digits 0-9 for grayscale mapping.

```bash
# Single frame conversion
lua ascii_numerical.lua frames/frame_0001.png ascii_frames/frame_0001.txt

# Batch conversion using shell script
./create_ascii_art.sh
```

#### Option 2: Extended Unicode Characters (Rich, 427 characters)
Uses Latin Extended, Cyrillic, Greek, and box-drawing characters for detailed grayscale mapping.

```bash
# Single frame conversion
lua ascii_wild.lua frames/frame_0001.png ascii_frames/frame_0001.txt

# For batch conversion, modify create_ascii_art.sh to use ascii_wild.lua instead
```

**Script Details:**
- `ascii_numerical.lua` - Simple 10-character palette (0-9)
- `ascii_wild.lua` - Extended 427-character palette from `extract_to_array.txt`
- Both scripts use FFmpeg/FFprobe to analyze pixel brightness and map to characters
- Default target width: 70 characters (configurable in script)

### Step 2B: Batch ASCII Art Generation

Use the provided shell script to process all frames automatically:

```bash
./create_ascii_art.sh
```

**What it does:**
- Validates Lua script and frames directory exist
- Creates `ascii_frames/` output directory
- Processes all PNG frames to ASCII text files
- Shows progress indicator
- Outputs frame_0001.txt, frame_0002.txt, etc.

### Step 3A: Convert ASCII to JSON (For Web Frontend)

Convert ASCII text files into a single JSON file for web animation:

```bash
node create_json_ascii.js
```

**What it does:**
- Reads all `.txt` files from `ascii_frames/` directory
- Converts each text file to an array of strings (one per line)
- Outputs `frames.json` - a single JSON file containing all frames
- Typical output size: 850KB for 626 frames

**JSON Structure:**
```javascript
[
  ["line1", "line2", "line3", ...],  // Frame 1
  ["line1", "line2", "line3", ...],  // Frame 2
  // ... more frames
]
```

### Step 3B: Convert ASCII to Video (For Standalone Playback)

Create an MP4 video from ASCII art frames:

```bash
./create_ascii_video.sh
```

**What it does:**
1. Converts PNG frames to ASCII text (Step 2A)
2. Uses ImageMagick to render ASCII text as images
3. Uses FFmpeg to compile images into MP4 video

**Dependencies:**
- FFmpeg (frame extraction, video encoding)
- Lua 5.1+ (ASCII conversion)
- ImageMagick (text-to-image rendering for video route)
- bc (progress calculation in shell scripts)

**Output:**
- `ascii_video.mp4` - Final ASCII art video at 10 FPS
- `ascii_images/` - Intermediate PNG images of rendered text

**Video Configuration (in script):**
- `FRAME_RATE=10` - Match your extraction FPS
- `FONT="Courier"` - Monospaced font for ASCII
- `POINT_SIZE=10` - Font size
- `IMG_BACKGROUND="black"` - Background color
- `IMG_FOREGROUND="white"` - Text color

## Web Frontend Integration

The web frontend displays ASCII animation using `index.html` and `server.js`.

### index.html

Single-page application with inline animation logic:

**Features:**
- Loads `frames.json` on page load
- Uses `requestAnimationFrame` for smooth playback
- Default 10 FPS (configurable)
- Respects `prefers-reduced-motion` user preference
- Continuous playback even when window is inactive
- Fade-in effect when frames load

**FPS Control:**
To modify animation speed, change the FPS parameter in two locations:

```javascript
// Line 66: AnimationManager constructor
this.frameTime = 1000 / fps; // FPS CONTROL: Change fps parameter

// Line 128: AnimationManager initialization
animationManager = new AnimationManager(() => {
  // animation logic
}, 10); // 10 FPS - CHANGE THIS NUMBER to modify speed
```

Examples:
- `5` - Slower (5 FPS)
- `20` - Faster (20 FPS)
- `30` - Smooth (30 FPS)

**Centering Content:**
The current layout uses left padding. To enable horizontal centering, uncomment the flexbox styles in the `<style>` section:

```css
body { 
  /* Uncomment to enable horizontal centering: */
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
}
```

Alternative method using margin auto:
```css
pre {
  margin: 0 auto;
}
```

### server.js

Development server for local testing with proper static file serving:

**Purpose:**
- Bun's `--hot` mode on `index.html` serves HTML for all routes
- This breaks JSON file loading (returns HTML instead of JSON)
- `server.js` properly serves static files with correct MIME types

**Usage:**
```bash
bun --hot server.js
```

Server runs at `http://localhost:3000` and serves:
- `/` → `index.html`
- `/frames.json` → JSON file with correct Content-Type
- `/departure.woff` → Font file
- All other static assets

**Implementation:**
- Built on Bun's native HTTP server
- Async file existence checking
- 404 for missing files
- Hot module reloading enabled

**Production Note:**
For production deployment (GitHub Pages, Netlify, etc.), this server is not needed. Static hosts will serve files correctly. This is only for local development with Bun.

## File Structure

```
/
├── index.html                   # Web frontend (single page)
├── frames.json                  # Animation data (generated)
├── departure.woff              # Custom font
├── server.js                   # Development server
├── scripts/
│   ├── ascii_numerical.lua     # ASCII converter (10 chars)
│   ├── ascii_wild.lua          # ASCII converter (427 chars)
│   ├── create_ascii_art.sh     # Batch text generation
│   ├── create_ascii_video.sh   # Full video pipeline
│   ├── create_json_ascii.js    # JSON converter for web
│   ├── extract_to_array.txt    # Character set for ascii_wild.lua
│   ├── input.mp4               # Source video
│   ├── frames/                 # PNG frames (generated)
│   └── ascii_frames/           # ASCII text files (generated)
└── .github/
    └── workflows/
        └── pages.yml           # GitHub Pages deployment
```

## Workflow Summary

### Route 1: Web Animation
```
input.mp4 → [FFmpeg] → PNG frames → [Lua] → ASCII text → [Node.js] → frames.json → [Browser] → Animation
```

### Route 2: Standalone Video
```
input.mp4 → [FFmpeg] → PNG frames → [Lua] → ASCII text → [ImageMagick] → ASCII images → [FFmpeg] → ascii_video.mp4
```

## Quick Start

### For Web Animation:
```bash
cd scripts

# 1. Extract frames
ffmpeg -i input.mp4 -vf "fps=10,scale=420:-1" frames/frame_%04d.png

# 2. Generate ASCII art
./create_ascii_art.sh

# 3. Create JSON
node create_json_ascii.js

# 4. Start dev server
cd ..
bun --hot server.js

# 5. Open http://localhost:3000
```

### For Video Output:
```bash
cd scripts

# One-step process (includes frame extraction via FFmpeg)
./create_ascii_video.sh

# Output: ascii_video.mp4
```

## Configuration Tips

**Adjusting Output Size:**
- Modify `scale=420:-1` in FFmpeg command for different widths
- Larger width = more detail, larger file sizes
- 70-character width typical for terminal, 420px for web

**Changing Character Sets:**
- Edit `local chars = {...}` in Lua scripts
- Order matters: lighter characters first, darker last
- More characters = finer grayscale detail

**FPS Considerations:**
- 10 FPS: Good balance (smooth, reasonable file size)
- 5 FPS: Smaller files, choppier animation
- 30 FPS: Very smooth, large files

## Deployment

### GitHub Pages

Deployment configured in `.github/workflows/pages.yml`:
- Triggered on push to `main` branch
- Deploys entire repository as static site
- No build step required (static files)

**Setup:**
1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"
3. Push to `main` branch
4. Site deploys automatically

**Note:** GitHub Pages serves static files correctly without `server.js`. The development server is only needed for local testing with Bun's hot-reload.

## Dependencies

**Required:**
- FFmpeg (video processing, frame extraction)
- Lua 5.1+ (ASCII conversion)
- Node.js or Bun (JSON generation, dev server)

**Optional (for video route):**
- ImageMagick (ASCII text rendering)
- bc (shell math calculations)

## License

Copyright 2025 Automate The Stack. All rights reserved.
