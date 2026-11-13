// Preload and decode the short feedback sounds ahead of the first answer.
(() => {
  const soundUrls = {
    correct: 'https://raw.githubusercontent.com/kefeng62/sikiryokeisan/main/%E6%88%90%E5%8A%9F%E9%9F%B3.wav',
    wrong: 'https://raw.githubusercontent.com/kefeng62/sikiryokeisan/main/%E5%A4%B1%E6%95%97%E9%9F%B3.mp3'
  };
  const buffers = {};
  const audioElements = {};
  let audioContext = null;

  // HTMLAudio fallback is also preloaded for browsers without Web Audio support.
  for (const [kind, url] of Object.entries(soundUrls)) {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = url;
    audio.load();
    audioElements[kind] = audio;
  }

  function prepareAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    try {
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    } catch (_) {
      audioContext = null;
    }
  }

  // Start/resume the audio context from the user's first interaction, not when
  // the answer is submitted, so playback does not wait for browser activation.
  document.addEventListener('pointerdown', prepareAudio, { capture: true, passive: true });
  document.addEventListener('keydown', prepareAudio, { capture: true });
  document.addEventListener('touchstart', prepareAudio, { capture: true, passive: true });

  // Begin network loading as soon as the page is opened; decode once for low-latency playback.
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

  // Override the synthesized/uncached implementation in script.js.
  window.playSound = function playSound(kind) {
    const audio = audioElements[kind];
    if (!audio) return;

    if (audioContext && buffers[kind]) {
      try {
        if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
        const source = audioContext.createBufferSource();
        const gain = audioContext.createGain();
        source.buffer = buffers[kind];
        gain.gain.value = 0.75;
        source.connect(gain);
        gain.connect(audioContext.destination);
        source.start(0);
        return;
      } catch (_) {}
    }

    // Fallback while the buffer is loading, or on browsers without Web Audio.
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0.75;
      audio.play().catch(() => {});
    } catch (_) {}
  };
})();
