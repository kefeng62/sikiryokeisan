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

  function renderProgress() {
    const rank = Number(localStorage.getItem('formula-player-rank') || 1);
    const xp = Number(localStorage.getItem('formula-player-xp') || 0);
    progress.textContent = `PLAYER RANK ${rank}　XP：${xp} / ${xpNeeded(rank)}`;
  }

  function renderFastestTimes() {
    cards.querySelectorAll('.level-card').forEach(card => {
      const match = card.className.match(/level-(\d+)/);
      if (!match) return;
      const level = Number(match[1]);
      const label = card.querySelector('.fastest-time');
      if (!label) return;

      let fastest = Number(localStorage.getItem(`formula-game-fastest-${level}`) || 0);
      fastest = Number.isFinite(fastest) && fastest > 0 ? fastest : 0;
      label.textContent = fastest > 0 ? `最速タイム：${formatTime(fastest)}` : '最速タイム：--:--.--';
    });
  }

  renderProgress();
  renderFastestTimes();

  new MutationObserver(renderProgress).observe(home, {
    attributes: true,
    attributeFilter: ['class']
  });
  new MutationObserver(renderFastestTimes).observe(cards, { childList: true });
  new MutationObserver(renderFastestTimes).observe(resultScreen, {
    attributes: true,
    attributeFilter: ['class']
  });

  window.addEventListener('storage', () => {
    renderProgress();
    renderFastestTimes();
  });
})();
