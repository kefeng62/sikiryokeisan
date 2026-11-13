function renderLevelCards() {
  $('level-cards').innerHTML = '';

  for (let level = 1; level <= 4; level++) {
    const best = Number(localStorage.getItem(`formula-game-best-${level}`) || 0);
    const fastest = Number(localStorage.getItem(`formula-game-fastest-${level}`) || 0);
    const card = document.createElement('button');

    card.className = `level-card level-${level}`;
    const available = level === 1 || level === 2;
    card.disabled = !available;

    const fastestText = available && fastest > 0
      ? `最速タイム：${formatTime(fastest)}`
      : '最速タイム：--:--.--';

    card.innerHTML = `
      <strong>Level　${level}</strong>
      <small>${available ? `High Score：${best}` : '準備中'}</small>
      <small class="fastest-time">${fastestText}</small>
      <span class="best">${available ? (best ? rankFor(best, theoreticalPerQuestion(level) * gameQuestionCount(level)) : '') : ''}</span>
    `;

    if (available) {
      card.addEventListener('click', () => startGame(level));
    }

    $('level-cards').appendChild(card);
  }
}
