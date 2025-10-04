// Animation Manager 
class AnimationManager {
  constructor(callback, fps = 10) {
    this._animation = null;
    this.callback = callback;
    this.lastFrame = -1;
    this.frameTime = 1000 / fps; // FPS CONTROL: Change fps parameter to adjust animation speed
  }

  // FPS CONTROL: Call this method to dynamically change FPS after initialization
  // Example: animationManager.updateFPS(20) for 20 FPS
  updateFPS(fps) {
    this.frameTime = 1000 / fps;
  }

  start() {
    if (this._animation != null) return;
    this._animation = requestAnimationFrame(this.update.bind(this));
  }

  pause() {
    if (this._animation == null) return;
    this.lastFrame = -1;
    cancelAnimationFrame(this._animation);
    this._animation = null;
  }

  update(time) {
    const { lastFrame } = this;
    let delta = time - lastFrame;
    
    if (this.lastFrame === -1) {
      this.lastFrame = time;
    } else {
      while (delta >= this.frameTime) {
        this.callback();
        delta -= this.frameTime;
        this.lastFrame += this.frameTime;
      }
    }
    
    this._animation = requestAnimationFrame(this.update.bind(this));
  }
}

// Main animation logic
(async function initAnimation() {
  // Lazy element getters to tolerate late DOM changes
  const getAboveEl = () => document.getElementById('animation-content-above-490');
  const getBelowEl = () => document.getElementById('animation-content-below-490');

  let framesAbove = [];
  let framesBelow = [];
  let currentFrameAbove = 0;
  let currentFrameBelow = 0;
  let managerAbove = null;
  let managerBelow = null;
  let baseFPS = 10; // Base FPS for animation
  const MOBILE_TARGET_ROWS = 35; // Target number of rows for rotated mobile view

  async function loadFrames(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load frames: ${response.status}`);
    }
    return await response.json();
  }

  function ensureManagers() {
    if (!managerAbove) {
      managerAbove = new AnimationManager(() => {
        if (!framesAbove.length) return;
        currentFrameAbove = (currentFrameAbove + 1) % framesAbove.length;
        const el = getAboveEl();
        if (!el) return;
        el.textContent = framesAbove[currentFrameAbove].join('\n');
      }, baseFPS);
    }
    if (!managerBelow) {
      managerBelow = new AnimationManager(() => {
        if (!framesBelow.length) return;
        currentFrameBelow = (currentFrameBelow + 1) % framesBelow.length;
        const el = getBelowEl();
        if (!el) return;
        el.textContent = framesBelow[currentFrameBelow].join('\n');
      }, baseFPS);
    }
  }

  async function startAbove() {
    if (!framesAbove.length) {
      framesAbove = await loadFrames('./public/frames-70-char.json');
    }
    // Ensure the element is populated and visible every time we switch up
    const el = getAboveEl();
    if (!el) throw new Error('Missing #animation-content-above-490 element');
    el.textContent = framesAbove[0].join('\n');
    el.classList.add('loaded');
    ensureManagers();
    managerBelow && managerBelow.pause();
    managerAbove.updateFPS(baseFPS);
    managerAbove.start();
  }

  async function startBelow() {
    // Build rotated frames on the fly from the same source frames
    if (!framesAbove.length) {
      framesAbove = await loadFrames('./public/frames-70-char.json');
    }
    if (!framesBelow.length) {
      const rotate90Clockwise = (lines) => {
        const height = lines.length;
        const width = Math.max(0, ...lines.map((l) => l.length));
        const grid = lines.map((l) => l.padEnd(width, ' '));
        const rotated = [];
        for (let x = 0; x < width; x++) {
          let row = '';
          for (let y = height - 1; y >= 0; y--) {
            row += grid[y][x];
          }
          rotated.push(row);
        }
        // Trim entirely blank leading/trailing rows introduced by rotation/padding
        const isBlank = (s) => s.trim().length === 0;
        let start = 0;
        while (start < rotated.length && isBlank(rotated[start])) start++;
        let end = rotated.length - 1;
        while (end >= start && isBlank(rotated[end])) end--;
        return rotated.slice(start, end + 1);
      };
      const downsampleRows = (lines, target) => {
        if (lines.length <= target) return lines;
        const result = [];
        const step = (lines.length - 1) / (target - 1);
        let prevIndex = -1;
        for (let i = 0; i < target; i++) {
          let idx = Math.round(i * step);
          if (idx <= prevIndex) idx = prevIndex + 1;
          if (idx >= lines.length) idx = lines.length - 1;
          result.push(lines[idx]);
          prevIndex = idx;
        }
        // Ensure edges are preserved exactly
        result[0] = lines[0];
        result[result.length - 1] = lines[lines.length - 1];
        return result;
      };
      framesBelow = framesAbove.map((frameLines) => {
        const rotated = rotate90Clockwise(frameLines);
        return downsampleRows(rotated, MOBILE_TARGET_ROWS);
      });
    }
    // Ensure the element is populated and visible every time we switch down
    const el = getBelowEl();
    if (!el) throw new Error('Missing #animation-content-below-490 element');
    el.textContent = framesBelow[0].join('\n');
    el.classList.add('loaded');
    ensureManagers();
    managerAbove && managerAbove.pause();
    managerBelow.updateFPS(baseFPS);
    managerBelow.start();
  }

  function scheduleFpsJitter() {
    const nextInMs = 4000 + Math.random() * 4000; // 4-8s
    setTimeout(() => {
      const jitter = (Math.random() * 4) - 2; // -2..+2
      const newFps = Math.max(5, Math.min(30, baseFPS + jitter));
      baseFPS = newFps;
      if (managerAbove) managerAbove.updateFPS(newFps);
      if (managerBelow) managerBelow.updateFPS(newFps);
      scheduleFpsJitter();
    }, nextInMs);
  }

  try {
    // FPS click-to-cycle on both brand links (duplicate IDs are handled via querySelectorAll)
    const brandEls = document.querySelectorAll('#brand');
    const fpsOptions = [5, 10, 15, 20, 24, 30];
    let fpsIndex = Math.max(0, fpsOptions.indexOf(baseFPS));
    brandEls.forEach((brandEl) => {
      brandEl.addEventListener('click', (e) => {
        e.preventDefault();
        fpsIndex = (fpsIndex + 1) % fpsOptions.length;
        baseFPS = fpsOptions[fpsIndex];
        if (managerAbove) managerAbove.updateFPS(baseFPS);
        if (managerBelow) managerBelow.updateFPS(baseFPS);
      });
    });

    scheduleFpsJitter();

    // Start the appropriate animation based on viewport, and switch on resize
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mq = window.matchMedia('(max-width: 490px)');

    async function applyBreakpoint(isBelow) {
      if (reducedMotion) return;
      try {
        if (isBelow) {
          await startBelow();
        } else {
          await startAbove();
        }
      } catch (err) {
        console.error('Animation initialization failed:', err);
        const target = isBelow ? getBelowEl() : getAboveEl();
        if (target) target.textContent = 'Failed to load animation. Please refresh the page.';
      }
    }

    // Initial start
    await applyBreakpoint(mq.matches);

    // React to viewport changes
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', (e) => applyBreakpoint(e.matches));
    } else if (typeof mq.addListener === 'function') {
      // Safari fallback
      mq.addListener((e) => applyBreakpoint(e.matches));
    }
  } catch (error) {
    console.error('Animation setup failed:', error);
    const above = getAboveEl();
    if (above) above.textContent = 'Failed to load animation. Please refresh the page.';
  }
})();


