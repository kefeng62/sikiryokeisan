// Preload and decode feedback sounds, and provide soft synthesized UI taps.
(() => {
  const soundUrls = {
    correct: 'https://raw.githubusercontent.com/kefeng62/sikiryokeisan/main/%E6%88%90%E5%8A%9F%E9%9F%B3.wav',
    wrong: 'https://raw.githubusercontent.com/kefeng62/sikiryokeisan/main/%E5%A4%B1%E6%95%97%E9%9F%B3.mp3'
  };
  const VOLUME_KEY = 'formula-game-sound-volume';
  const DEFAULT_VOLUME = 0.7;
  const buffers = {};
  const audioElements = {};
  let audioContext = null;
  let volume = readSavedVolume();

  function readSavedVolume() {
    try {
      const saved = localStorage.getItem(VOLUME_KEY);
      if (saved === null) return DEFAULT_VOLUME;
      const parsed = Number(saved);
      return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : DEFAULT_VOLUME;
    } catch (_) {
      return DEFAULT_VOLUME;
    }
  }

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    try {
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new AudioContextClass();
      }
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
      return audioContext;
    } catch (_) {
      return null;
    }
  }

  // HTMLAudio fallback for browsers without Web Audio support.
  for (const [kind, url] of Object.entries(soundUrls)) {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio.load();
    audioElements[kind] = audio;
  }

  // Unlock/resume audio from a real user gesture for mobile browsers.
  function prepareAudio() { getAudioContext(); }
  document.addEventListener('pointerdown', prepareAudio, { capture: true, passive: true });
  document.addEventListener('keydown', prepareAudio, { capture: true });
  document.addEventListener('touchstart', prepareAudio, { capture: true, passive: true });

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (AudioContextClass) {
    try {
      audioContext = new AudioContextClass();
      for (const [kind, url] of Object.entries(soundUrls)) {
        fetch(url)
          .then(response => {
            if (!response.ok) throw new Error(`Sound request failed: ${response.status}`);
            return response.arrayBuffer();
          })
          .then(data => audioContext.decodeAudioData(data))
          .then(buffer => { buffers[kind] = buffer; })
          .catch(() => {});
      }
    } catch (_) {
      audioContext = null;
    }
  }

  function setSoundVolume(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    volume = Math.min(1, Math.max(0, next));
    try { localStorage.setItem(VOLUME_KEY, String(volume)); } catch (_) {}
  }

  function playSound(kind) {
    if (volume <= 0) return;
    const audio = audioElements[kind];
    if (!audio) return;

    const context = getAudioContext();
    if (context && buffers[kind]) {
      try {
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffers[kind];
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(context.destination);
        source.start(0);
        return;
      } catch (_) {}
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch (_) {}
  }

  // A quiet, warm two-note tap, synthesized locally so it loads instantly.
  function playTapSound() {
    if (volume <= 0) return;
    const context = getAudioContext();
    if (!context) return;
    try {
      const now = context.currentTime;
      [[740, 0, 0.045], [1046, 0.025, 0.055]].forEach(([frequency, offset, duration]) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now + offset);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.12), now + offset + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + duration + 0.005);
      });
    } catch (_) {}
  }

  window.playSound = playSound;
  window.setSoundVolume = setSoundVolume;
  window.getSoundVolume = () => volume;
  window.playTapSound = playTapSound;

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button && !button.disabled && !button.hasAttribute('data-no-tap')) playTapSound();
  });

  const settingsModal = document.getElementById('sound-settings-modal');
  const slider = document.getElementById('sound-volume');
  const valueLabel = document.getElementById('sound-volume-value');
  const closeSettings = () => settingsModal.classList.add('hidden');

  slider.value = String(Math.round(volume * 100));
  valueLabel.value = `${slider.value}%`;
  valueLabel.textContent = `${slider.value}%`;

  slider.addEventListener('input', () => {
    setSoundVolume(Number(slider.value) / 100);
    valueLabel.value = `${slider.value}%`;
    valueLabel.textContent = `${slider.value}%`;
  });

  document.getElementById('sound-settings-button').addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
    slider.focus();
  });
  document.getElementById('close-sound-settings').addEventListener('click', closeSettings);
  document.getElementById('sound-settings-done').addEventListener('click', closeSettings);
  document.getElementById('sound-test-button').addEventListener('click', () => playSound('correct'));
  settingsModal.addEventListener('click', event => {
    if (event.target === settingsModal) closeSettings();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !settingsModal.classList.contains('hidden')) closeSettings();
  });
})();
