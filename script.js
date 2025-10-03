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
  const animationContent = document.getElementById('animation-content');
  let frames = [];
  let currentFrame = 0;
  let animationManager = null;

  try {
    // Fetch frames.json (either 70 char or 420 char version)
    const response = await fetch('./public/frames-70-char.json');
    if (!response.ok) {
      throw new Error(`Failed to load frames: ${response.status}`);
    }
    
    frames = await response.json();
    console.log(`Loaded ${frames.length} animation frames`);

    // Initialize animation manager
    // FPS CONTROL: Change the second parameter (currently 10) to adjust FPS
    // Examples: 5 = slower (5 FPS), 20 = faster (20 FPS), 30 = smooth (30 FPS)
    let baseFPS = 10; // Base FPS for animation
    animationManager = new AnimationManager(() => {
      currentFrame = (currentFrame + 1) % frames.length;
      animationContent.textContent = frames[currentFrame].join('\n');
    }, baseFPS); // CHANGE baseFPS to modify the default animation speed

    // Set initial frame
    animationContent.textContent = frames[0].join('\n');
    animationContent.classList.add('loaded');

    // Lightweight, occasional FPS randomization for subtle variation
    // Randomly varies FPS by ±2 every 4–8 seconds for a lively feel
    function scheduleFpsJitter() {
      const nextInMs = 4000 + Math.random() * 4000; // 4-8s
      setTimeout(() => {
        const jitter = (Math.random() * 4) - 2; // -2..+2
        const newFps = Math.max(5, Math.min(30, baseFPS + jitter));
        animationManager.updateFPS(newFps);
        scheduleFpsJitter();
      }, nextInMs);
    }
    scheduleFpsJitter();

    // Click-to-cycle FPS on title
    const brandEl = document.getElementById('brand');
    if (brandEl) {
      const fpsOptions = [5, 10, 15, 20, 24, 30];
      let fpsIndex = Math.max(0, fpsOptions.indexOf(baseFPS));
      brandEl.addEventListener('click', (e) => {
        e.preventDefault();
        fpsIndex = (fpsIndex + 1) % fpsOptions.length;
        baseFPS = fpsOptions[fpsIndex];
        animationManager.updateFPS(baseFPS);
      });
    }

    // Start animation if page is visible
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      animationManager.start(); // Always start animation regardless of visibility
    }

    // Removed focus/blur and visibilitychange event listeners to allow
    // animation to continue running even when window is not active.
    // This increases CPU usage but ensures continuous animation.
    // To re-enable performance optimization (pause when inactive), uncomment:
    
    // window.addEventListener('focus', () => animationManager.start());
    // window.addEventListener('blur', () => animationManager.pause());
    // document.addEventListener('visibilitychange', () => {
    //   if (document.visibilityState === 'visible') {
    //     animationManager.start();
    //   } else {
    //     animationManager.pause();
    //   }
    // });

  } catch (error) {
    console.error('Animation initialization failed:', error);
    animationContent.textContent = 'Failed to load animation. Please refresh the page.';
  }
})();


