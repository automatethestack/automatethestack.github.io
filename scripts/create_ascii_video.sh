#!/bin/bash

# Set variables
FRAME_DIR="frames"
ASCII_TXT_DIR="ascii_frames"
ASCII_IMG_DIR="ascii_images"
OUTPUT_VIDEO="ascii_video.mp4"
FRAME_RATE=10 # Should match the extraction frame rate
FONT="Courier" # Monospaced font is recommended
POINT_SIZE=10
IMG_BACKGROUND="black"
IMG_FOREGROUND="white"

# --- safety checks ---
# Check if Lua script exists
if [ ! -f "ascii.lua" ]; then
    echo "Error: ascii.lua script not found in the current directory."
    exit 1
fi

# Check if frame directory exists and is not empty
if [ ! -d "$FRAME_DIR" ] || [ -z "$(ls -A $FRAME_DIR/*.png 2>/dev/null)" ]; then
    echo "Error: '$FRAME_DIR' directory not found or contains no PNG frames."
    echo "Please run the FFmpeg frame extraction command first."
    exit 1
fi

# Check if ImageMagick's convert command is available
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick 'convert' command not found. Please install ImageMagick."
    exit 1
fi

# Check if FFmpeg command is available
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: 'ffmpeg' command not found. Please install FFmpeg."
    exit 1
fi


# --- processing Steps ---
echo "Starting ASCII art generation process..."

# Create output directories
mkdir -p "$ASCII_TXT_DIR"
mkdir -p "$ASCII_IMG_DIR"

# Count total frames for progress reporting
FRAME_FILES=("$FRAME_DIR"/frame_*.png)
FRAME_COUNT=${#FRAME_FILES[@]}
CURRENT_FRAME=0

echo "Step 1: Processing $FRAME_COUNT frames into ASCII text..."
# Process all frames into text files
for frame_png in "${FRAME_FILES[@]}"; do
  CURRENT_FRAME=$((CURRENT_FRAME + 1))
  base_name=$(basename "$frame_png" .png)
  output_txt="$ASCII_TXT_DIR/${base_name}.txt"

  # Run Lua script, redirect stdout to file, stderr remains on console
  if ! lua ascii.lua "$frame_png" "$output_txt"; then
      echo "Error processing frame $frame_png with Lua script. Aborting."
      exit 1
  fi

  # Simple progress indicator
  printf "Processing frame %d/%d (%.0f%%)\r" "$CURRENT_FRAME" "$FRAME_COUNT" $(echo "scale=2; 100 * $CURRENT_FRAME / $FRAME_COUNT" | bc)
done
echo -e "\nASCII text generation complete."


echo "Step 2: Converting ASCII text files to images..."
# Convert ASCII text frames to PNG images using ImageMagick's convert tool
# Use 'caption:@' to read text from file. adjust font, size, colors as needed.
TXT_FILES=("$ASCII_TXT_DIR"/*.txt)
TXT_COUNT=${#TXT_FILES[@]}
CURRENT_TXT=0
for txt_file in "${TXT_FILES[@]}"; do
  CURRENT_TXT=$((CURRENT_TXT + 1))
  base_name=$(basename "$txt_file" .txt)
  output_png="$ASCII_IMG_DIR/${base_name}.png"

  # Use caption:@ which attempts to fit text; may need tweaking
  if ! convert -background "$IMG_BACKGROUND" -fill "$IMG_FOREGROUND" -font "$FONT" -pointsize "$POINT_SIZE" \
          caption:@"$txt_file" "$output_png"; then
      echo "Error converting $txt_file to image using ImageMagick. Aborting."
      exit 1
  fi
   printf "Converting text file %d/%d\r" "$CURRENT_TXT" "$TXT_COUNT"
done
echo -e "\nImage generation complete."


echo "Step 3: Creating final ASCII video from images..."
# Create video from the generated ASCII images using FFmpeg
# -framerate: input frame rate
# -i: input pattern for images
# -c:v libx264: video codec (h.264 is widely compatible)
# -pix_fmt yuv420p: pixel format for compatibility
# -crf 23: constant rate factor (quality level, lower is better quality, 18-28 is typical)
# -y: overwrite output file without asking
if ! ffmpeg -framerate "$FRAME_RATE" -i "$ASCII_IMG_DIR/frame_%04d.png" \
       -c:v libx264 -pix_fmt yuv420p -crf 23 \
       -y "$OUTPUT_VIDEO"; then
   echo "Error creating video with FFmpeg. Aborting."
   exit 1
fi

echo "-------------------------------------"
echo "ASCII video creation successful!"
echo "Output file: $OUTPUT_VIDEO"
echo "-------------------------------------"

exit 0