function finishGame() {
  if (!game || game.finishing) return;

  game.finishing = true;

  clearInterval(timerInterval);
  clearTimeout(questionTimeout);

  const level = game.level;
  const theoretical = theoreticalPerQuestion(level) * game.questions.length;
  const rank = rankFor(game.score, theoretical);
  const bestKey = `formula-game-best-${level}`;
  const fastestKey = `formula-game-fastest-${level}`;

  const oldBest = Number(localStorage.getItem(bestKey) || 0);
  if (game.score > oldBest) {
    localStorage.setItem(bestKey, String(game.score));
  }

  const oldFastest = Number(localStorage.getItem(fastestKey) || 0);
  if (!Number.isFinite(oldFastest) || oldFastest <= 0 || game.totalTime < oldFastest) {
    localStorage.setItem(fastestKey, String(game.totalTime));
  }

  renderLevelCards();

  $('result-level').textContent = `Level ${level}`;
  $('result-score').textContent = game.score;
  $('result-time').textContent = formatTime(game.totalTime);
  $('result-miss').textContent = game.totalMiss;
  $('result-correct').textContent = `${game.correct} / ${game.questions.length}`;
  $('result-pass').textContent = game.passCount;
  $('result-rank').textContent = rank;

  $('rank-detail').textContent = '';

  const progress = getPlayerProgress();
  const gained = Math.round(game.score * 1.2);

  let rankUps = 0;

  progress.xp += gained;

  while (progress.xp >= xpNeeded(progress.rank)) {
    progress.xp -= xpNeeded(progress.rank);
    progress.rank++;
    rankUps++;
  }

  localStorage.setItem('formula-player-rank', String(progress.rank));
  localStorage.setItem('formula-player-xp', String(progress.xp));

  $('player-xp').textContent =
    `PLAYER RANK ${progress.rank}　XP：${progress.xp} / ${xpNeeded(progress.rank)}（今回 +${gained} XP）`;

  const rankup = $('player-rankup');

  if (rankUps > 0) {
    rankup.textContent =
      `LEVEL UP！ プレイヤーランク ${progress.rank - rankUps} → ${progress.rank}`;

    rankup.classList.remove('hidden');
    rankup.classList.remove('rankup-animation');

    void rankup.offsetWidth;

    rankup.classList.add('rankup-animation');
  } else {
    rankup.textContent = '';
    rankup.classList.add('hidden');
  }

  const cutoffs = [['S', .70], ['A', .55], ['B', .45], ['C', .30], ['D', .15]];

  $('rank-border').textContent =
    cutoffs.map(([label, rate]) => `${label}：${Math.ceil(theoretical * rate)}点以上`).join('　') +
    `　E：${Math.ceil(theoretical * .15) - 1}点以下`;

  game = null;
  showScreen('result-screen');
}
