// Keep player progress and each level's independently fastest completed time visible on the home screen.
(() => {
  const progress = document.getElementById('home-player-progress');
  const home = document.getElementById('home-screen');
  const cards = document.getElementById('level-cards');
  const resultScreen = document.getElementById('result-screen');
  if (!progress || !home || !cards || !resultScreen) return;

  function xpNeeded(rank) {
    if (rank <= 10) return 500 * rank + 500;
    if (rank <= 50) return 300 * rank + 5500;
    if (rank <= 200) return 21000;
    return 30000;
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds - minutes * 60;
    return `${minutes}:${remainder.toFixed(2).padStart(5, '0')}`;
  }

  function parseTime(value) {
    const match = value.trim().match(/^(\d+):(\d{2}\.\d{2})$/);
    if (!match) return NaN;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function renderProgress() {
    const rank = Number(localStorage.getItem('formula-player-rank') || 1);
    const xp = Number(localStorage.getItem('formula-player-xp') || 0);
    progress.textContent = `PLAYER RANK ${rank}　XP：${xp} / ${xpNeeded(rank)}`;
  }

  function renderFastestTimes() {
    cards.querySelectorAll('.level-card').forEach(card => {
      const levelClass = [...card.classList].find(name => /^level-\d+$/.test(name));
      if (!levelClass) return;
      const level = Number(levelClass.slice('level-'.length));
      let label = card.querySelector('.fastest-time');
      if (!label) {
        label = document.createElement('small');
        label.className = 'fastest-time';
        card.appendChild(label);
      }
      let best = NaN;
      try { best = Number(localStorage.getItem(`formula-game-fastest-${level}`)); } catch (_) {}
      label.textContent = Number.isFinite(best) && best > 0
        ? `最速タイム：${formatTime(best)}`
        : '最速タイム：--:--.--';
    });
  }

  function recordFinishedTime() {
    if (resultScreen.classList.contains('hidden')) return;
    const levelMatch = document.getElementById('result-level').textContent.match(/\d+/);
    const elapsed = parseTime(document.getElementById('result-time').textContent);
    if (!levelMatch || !Number.isFinite(elapsed) || elapsed <= 0) return;

    const key = `formula-game-fastest-${Number(levelMatch[0])}`;
    let previous = NaN;
    try { previous = Number(localStorage.getItem(key)); } catch (_) {}
    if (!Number.isFinite(previous) || previous <= 0 || elapsed < previous) {
      try { localStorage.setItem(key, String(elapsed)); } catch (_) {}
      renderFastestTimes();
    }
  }

  renderProgress();
  renderFastestTimes();

  new MutationObserver(renderProgress).observe(home, {
    attributes: true,
    attributeFilter: ['class']
  });
  new MutationObserver(renderFastestTimes).observe(cards, { childList: true });
  new MutationObserver(recordFinishedTime).observe(resultScreen, {
    attributes: true,
    attributeFilter: ['class']
  });

  window.addEventListener('storage', () => {
    renderProgress();
    renderFastestTimes();
  });
})();
