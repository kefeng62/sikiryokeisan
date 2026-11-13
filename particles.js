// Draw a small, irregular set of drifting gray particles on the gameplay screen.
(() => {
  const layer = document.querySelector('.game-particles');
  const screen = document.getElementById('game-screen');
  if (!layer || !screen) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  layer.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const PARTICLE_COUNT = 30;
  const SIZE_TIERS = [1.25, 2.1, 3.1];
  const particles = [];
  let width = 0;
  let height = 0;
  let lastFrame = 0;
  let animationId = 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function resize() {
    const rect = layer.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const tier = Math.random() < 0.62 ? 0 : (Math.random() < 0.72 ? 1 : 2);
      const speed = random(5, 17);
      const direction = random(0, Math.PI * 2);
      particles.push({
        x: random(0, width),
        y: random(0, height),
        radius: SIZE_TIERS[tier] * random(.8, 1.2),
        vx: Math.cos(direction) * speed,
        vy: Math.sin(direction) * speed,
        alpha: random(.24, .48),
        phase: random(0, Math.PI * 2),
        wobble: random(1.5, 5)
      });
    }
    draw();
  }

  function draw(delta = 0) {
    if (!width || !height) return;
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.phase += delta * .001;
      p.x += p.vx * delta / 1000 + Math.sin(p.phase) * p.wobble * delta / 1000;
      p.y += p.vy * delta / 1000 + Math.cos(p.phase * .83) * p.wobble * delta / 1000;

      if (p.x < -5) p.x = width + 5;
      else if (p.x > width + 5) p.x = -5;
      if (p.y < -5) p.y = height + 5;
      else if (p.y > height + 5) p.y = -5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      // Neutral gray, slightly darker than the gameplay panel background.
      ctx.fillStyle = `rgba(92, 92, 92, ${p.alpha})`;
      ctx.fill();
    }
  }

  function animate(timestamp) {
    animationId = 0;
    if (screen.classList.contains('hidden')) return;
    const delta = lastFrame ? Math.min(timestamp - lastFrame, 50) : 16;
    lastFrame = timestamp;
    if (!reduceMotion.matches) draw(delta);
    animationId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (animationId || screen.classList.contains('hidden')) return;
    lastFrame = 0;
    animationId = requestAnimationFrame(animate);
  }

  new MutationObserver(startAnimation).observe(screen, {
    attributes: true,
    attributeFilter: ['class']
  });
  window.addEventListener('resize', resize, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resize).observe(layer);
  }

  resize();
  startAnimation();
})();
