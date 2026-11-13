// Sound effects and independent per-sound volume controls.
(() => {
  const STORAGE_PREFIX = 'formula-game-volume-';
  const DEFAULT_VOLUMES = { tap: 0.9, correct: 0.7, wrong: 0.7 };
  const soundUrls = {
    correct: 'https://raw.githubusercontent.com/kefeng62/sikiryokeisan/main/%E6%88%90%E5%8A%9F%E9%9F%B3.wav',
    wrong: 'https://raw.githubusercontent.com/kefeng62/sikiryokeisan/main/%E5%A4%B1%E6%95%97%E9%9F%B3.mp3'
  };
  const buffers = {};
  const audioElements = {};
  const volumes = { ...DEFAULT_VOLUMES };
  let context = null;

  // Migrate the previous shared setting to the two answer sounds, if present.
  try {
    const oldVolume = localStorage.getItem('formula-game-sound-volume');
    if (oldVolume !== null && Number.isFinite(Number(oldVolume))) {
      volumes.correct = volumes.wrong = Math.min(1, Math.max(0, Number(oldVolume)));
    }
    for (const kind of Object.keys(volumes)) {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${kind}`);
      if (saved !== null && Number.isFinite(Number(saved))) {
        volumes[kind] = Math.min(1, Math.max(0, Number(saved)));
      }
    }
  } catch (_) {}

  function getContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      if (!context || context.state === 'closed') context = new AudioContextClass();
      if (context.state === 'suspended') context.resume().catch(() => {});
      return context;
    } catch (_) { return null; }
  }

  for (const [kind, url] of Object.entries(soundUrls)) {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audioElements[kind] = audio;
  }

  // Preload audio buffers; HTMLAudio is used as a fallback.
  const preloadContext = getContext();
  if (preloadContext) {
    for (const [kind, url] of Object.entries(soundUrls)) {
      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error(`Sound request failed: ${response.status}`);
          return response.arrayBuffer();
        })
        .then(data => preloadContext.decodeAudioData(data))
        .then(buffer => { buffers[kind] = buffer; })
        .catch(() => {});
    }
  }

  function setSoundVolume(kind, value) {
    if (!(kind in volumes)) return;
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    volumes[kind] = Math.min(1, Math.max(0, number));
    try { localStorage.setItem(`${STORAGE_PREFIX}${kind}`, String(volumes[kind])); } catch (_) {}
  }

  function playSound(kind) {
    if (volumes[kind] === undefined || volumes[kind] <= 0) return;
    const audio = audioElements[kind];
    if (!audio) return;
    const activeContext = getContext();
    if (activeContext && buffers[kind]) {
      try {
        const source = activeContext.createBufferSource();
        const gain = activeContext.createGain();
        source.buffer = buffers[kind];
        gain.gain.value = volumes[kind];
        source.connect(gain);
        gain.connect(activeContext.destination);
        source.start();
        return;
      } catch (_) {}
    }
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volumes[kind];
      const promise = audio.play();
      if (promise) promise.catch(() => {});
    } catch (_) {}
  }

  // Louder, crisp two-note tap synthesized locally (no extra audio file needed).
  function playTapSound() {
    const tapVolume = volumes.tap;
    if (tapVolume <= 0) return;
    const activeContext = getContext();
    if (!activeContext) return;
    try {
      const now = activeContext.currentTime;
      [[740, 0, 0.05], [1046, 0.025, 0.065]].forEach(([frequency, offset, duration]) => {
        const oscillator = activeContext.createOscillator();
        const gain = activeContext.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency, now + offset);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, tapVolume * 0.28), now + offset + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
        oscillator.connect(gain);
        gain.connect(activeContext.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + duration + 0.005);
      });
    } catch (_) {}
  }

  window.playSound = playSound;
  window.setSoundVolume = setSoundVolume;
  window.getSoundVolume = kind => volumes[kind];

  // Unlock audio on the user's gesture and play a tap for enabled buttons.
  document.addEventListener('pointerdown', () => { getContext(); }, { capture: true, passive: true });
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button && !button.disabled && !button.hasAttribute('data-no-tap')) playTapSound();
  });

  const modal = document.getElementById('sound-settings-modal');
  const openButton = document.getElementById('sound-settings-button');
  if (!modal || !openButton) return;

  const close = () => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  };
  openButton.addEventListener('click', () => {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('input[type="range"]')?.focus({ preventScroll: true });
  });
  document.getElementById('close-sound-settings')?.addEventListener('click', close);
  document.getElementById('sound-settings-done')?.addEventListener('click', close);
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });

  for (const kind of Object.keys(volumes)) {
    const slider = document.getElementById(`sound-volume-${kind}`);
    const output = document.getElementById(`sound-volume-${kind}-value`);
    if (!slider || !output) continue;
    const sync = () => {
      const percent = Math.round(volumes[kind] * 100);
      slider.value = String(percent);
      output.value = `${percent}%`;
      output.textContent = `${percent}%`;
    };
    sync();
    slider.addEventListener('input', () => {
      setSoundVolume(kind, Number(slider.value) / 100);
      sync();
    });
    document.getElementById(`sound-test-${kind}`)?.addEventListener('click', () => {
      if (kind === 'tap') playTapSound();
      else playSound(kind);
    });
  }
})();
