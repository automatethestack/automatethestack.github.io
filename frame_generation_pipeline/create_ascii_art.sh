#!/bin/bash

# Set variables
FRAME_DIR="frames"
ASCII_TXT_DIR="ascii_frames"

# --- safety checks ---
# Check if Lua script exists
if [ ! -f "ascii.lua" ]; then
    echo "Error: ascii.lua script not found in the current directory."
    exit 1
fi

# Check if frame directory exists and is not empty
if [ ! -d "$FRAME_DIR" ] || [ -z "$(ls -A $FRAME_DIR/*.png 2>/dev/null)" ]; then
    echo "Error: '$FRAME_DIR' directory not found or contains no PNG frames."
    exit 1
fi

# --- processing Steps ---
echo "Starting ASCII art generation..."

# Create output directory
mkdir -p "$ASCII_TXT_DIR"

# Count total frames for progress reporting
FRAME_FILES=("$FRAME_DIR"/frame_*.png)
FRAME_COUNT=${#FRAME_FILES[@]}
CURRENT_FRAME=0

echo "Processing $FRAME_COUNT frames into ASCII text..."

# Process all frames into text files
for frame_png in "${FRAME_FILES[@]}"; do
  CURRENT_FRAME=$((CURRENT_FRAME + 1))
  base_name=$(basename "$frame_png" .png)
  output_txt="$ASCII_TXT_DIR/${base_name}.txt"

  # Run Lua script, redirect stdout to file, stderr remains on console
  if ! lua ascii.lua "$frame_png" "$output_txt" 2>/dev/null; then
      echo "Error processing frame $frame_png with Lua script. Aborting."
      exit 1
  fi

  # Simple progress indicator
  printf "Processing frame %d/%d (%.0f%%)\r" "$CURRENT_FRAME" "$FRAME_COUNT" $(echo "scale=2; 100 * $CURRENT_FRAME / $FRAME_COUNT" | bc)
done

echo -e "\nASCII art generation complete."
echo "-------------------------------------"
echo "Output directory: $ASCII_TXT_DIR"
echo "Total frames processed: $FRAME_COUNT"
echo "-------------------------------------"

exit 0

