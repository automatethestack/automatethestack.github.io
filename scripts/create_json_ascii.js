const fs = require('fs');
const path = require('path');

// Configuration
const FRAMES_DIR = './ascii_frames';
const OUTPUT_FILE = './frames.json';
const TOTAL_FRAMES = 626;

async function buildFramesJSON() {
  console.log('Building frames.json from ASCII frames...');
  
  const frames = [];
  let successCount = 0;
  let errorCount = 0;

  // Read all frame files
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const frameNumber = String(i).padStart(4, '0');
    const filename = `frame_${frameNumber}.txt`;
    const filepath = path.join(FRAMES_DIR, filename);

    try {
      const content = fs.readFileSync(filepath, 'utf8');
      // Split by newlines and filter out empty trailing lines
      const lines = content.split('\n').filter((line, idx, arr) => {
        // Keep all lines except trailing empty ones
        return idx < arr.length - 1 || line.length > 0;
      });
      frames.push(lines);
      successCount++;
      
      if (successCount % 100 === 0) {
        console.log(`  Processed ${successCount}/${TOTAL_FRAMES} frames...`);
      }
    } catch (error) {
      console.error(`  Error reading ${filename}:`, error.message);
      errorCount++;
    }
  }

  // Write frames to JSON
  const output = JSON.stringify(frames, null, 0); // Compact JSON
  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

  // Stats
  const stats = fs.statSync(OUTPUT_FILE);
  const sizeKB = (stats.size / 1024).toFixed(2);
  
  console.log('\n✓ Build complete!');
  console.log(`  Frames processed: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Output file: ${OUTPUT_FILE}`);
  console.log(`  File size: ${sizeKB} KB`);
}

buildFramesJSON().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});

