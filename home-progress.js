// Keep the player's saved rank and XP visible on the home screen.
(() => {
  const progress = document.getElementById('home-player-progress');
  const home = document.getElementById('home-screen');
  if (!progress || !home) return;

  function xpNeeded(rank) {
    if (rank <= 10) return 500 * rank + 500;
    if (rank <= 50) return 300 * rank + 5500;
    if (rank <= 200) return 21000;
    return 30000;
  }

  function render() {
    const rank = Number(localStorage.getItem('formula-player-rank') || 1);
    const xp = Number(localStorage.getItem('formula-player-xp') || 0);
    progress.textContent = `PLAYER RANK ${rank}　XP：${xp} / ${xpNeeded(rank)}`;
  }

  render();
  new MutationObserver(render).observe(home, {
    attributes: true,
    attributeFilter: ['class']
  });
  window.addEventListener('storage', render);
})();
