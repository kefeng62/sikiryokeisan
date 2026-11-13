// Sound effects and volume controls. This file is loaded after the page markup.
(() => {
  const VOLUME_KEY = 'formula-game-sound-volume';
  const DEFAULT_VOLUME = 0.7;
  const soundUrls = {
    correct: 'https://raw.githubusercontent.com/kefeng62/sikiryokeisan/main/%E6%88%90%E5%8A%9F%E9%9F%B3.wav',
    wrong: 'https://raw.githubusercontent.com/kefeng62/sikiryokeisan/main/%E5%A4%B1%E6%95%97%E9%9F%B3.mp3'
  };
  const buffers = {};
  const audioElements = {};
  let context = null;
  let volume = DEFAULT_VOLUME;

  try {
    const saved = localStorage.getItem(VOLUME_KEY);
    if (saved !== null && Number.isFinite(Number(saved))) {
      volume = Math.min(1, Math.max(0, Number(saved)));
    }
  } catch (_) {}

  function getContext() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      if (!context || context.state === 'closed') context = new Context();
      if (context.state === 'suspended') context.resume().catch(() => {});
      return context;
    } catch (_) { return null; }
  }

  for (const [kind, url] of Object.entries(soundUrls)) {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audioElements[kind] = audio;
  }

  // Load audio buffers where supported. Playback still works through HTMLAudio if this fails.
  const initialContext = getContext();
  if (initialContext) {
    for (const [kind, url] of Object.entries(soundUrls)) {
      fetch(url)
        .then(response => {
          if (!response.ok) throw new Error(`Sound request failed: ${response.status}`);
          return response.arrayBuffer();
        })
        .then(data => initialContext.decodeAudioData(data))
        .then(buffer => { buffers[kind] = buffer; })
        .catch(() => {});
    }
  }

  function setSoundVolume(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    volume = Math.min(1, Math.max(0, number));
    try { localStorage.setItem(VOLUME_KEY, String(volume)); } catch (_) {}
  }

  function playSound(kind) {
    if (volume <= 0) return;
    const audio = audioElements[kind];
    if (!audio) return;
    const activeContext = getContext();
    if (activeContext && buffers[kind]) {
      try {
        const source = activeContext.createBufferSource();
        const gain = activeContext.createGain();
        source.buffer = buffers[kind];
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(activeContext.destination);
        source.start();
        return;
      } catch (_) {}
    }
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volume;
      const promise = audio.play();
      if (promise) promise.catch(() => {});
    } catch (_) {}
  }

  function playTapSound() {
    if (volume <= 0) return;
    const activeContext = getContext();
    if (!activeContext) return;
    try {
      const now = activeContext.currentTime;
      [[740, 0, 0.045], [1046, 0.025, 0.055]].forEach(([frequency, offset, duration]) => {
        const oscillator = activeContext.createOscillator();
        const gain = activeContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now + offset);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.12), now + offset + 0.006);
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
  window.getSoundVolume = () => volume;

  // Resume from the user gesture, then play the click sound on pointerup.
  document.addEventListener('pointerdown', () => { getContext(); }, { capture: true, passive: true });
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button && !button.disabled && !button.hasAttribute('data-no-tap')) playTapSound();
  });

  const modal = document.getElementById('sound-settings-modal');
  const openButton = document.getElementById('sound-settings-button');
  const slider = document.getElementById('sound-volume');
  const valueOutput = document.getElementById('sound-volume-value');
  if (!modal || !openButton || !slider || !valueOutput) return;

  const close = () => {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
  };
  const open = () => {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    slider.focus({ preventScroll: true });
  };
  const syncVolume = () => {
    const percent = Math.round(volume * 100);
    slider.value = String(percent);
    valueOutput.value = `${percent}%`;
    valueOutput.textContent = `${percent}%`;
  };

  modal.setAttribute('aria-hidden', 'true');
  syncVolume();
  openButton.addEventListener('click', open);
  document.getElementById('close-sound-settings')?.addEventListener('click', close);
  document.getElementById('sound-settings-done')?.addEventListener('click', close);
  document.getElementById('sound-test-button')?.addEventListener('click', () => playSound('correct'));
  slider.addEventListener('input', () => {
    setSoundVolume(Number(slider.value) / 100);
    syncVolume();
  });
  modal.addEventListener('click', event => {
    if (event.target === modal) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) close();
  });
})();
