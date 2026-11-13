/*
 * 式量計算ゲーム
 * 問題・レベル別原子量は、下の GAME_DATA だけを編集すれば変更できます。
 * formula: 化学式 / answer: 正しい式量（整数） / name: 物質名
 */
const COMMON_ATOMIC_MASSES = {
  H: 1, He: 4, Li: 7, Be: 9, B: 11, C: 12, N: 14, O: 16, F: 19,
  Ne: 20, Na: 23, Mg: 24, Al: 27, Si: 28, P: 31, S: 32, Cl: 35.5,
  Ar: 40, K: 39, Ca: 40, Sc: 45, Ti: 48, V: 51, Cr: 52, Mn: 55,
  Fe: 56, Co: 59, Ni: 59, Cu: 64, Zn: 65, Br: 80, Ag: 108,
  I: 127, Ba: 137, Au: 197, Hg: 201, Pb: 207
};

const GAME_DATA = {
  1: {
    // このレベルで表示する原子量一覧。後から指定の一覧に置き換えてください。
    atomicMasses: { H: 1, C: 12, N: 14, O: 16, F: 19, Na: 23, Mg: 24, Al: 27, P: 31, S: 32 },
    questions: [
      { formula: 'H2SO4', name: '硫酸', answer: 98 },
      { formula: 'H2O', name: '水', answer: 18 },
      { formula: 'CO2', name: '二酸化炭素', answer: 44 }
    ]
  },
  2: {
    atomicMasses: { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, P: 31, S: 32, Cl: 35.5, K: 39, Ca: 40 },
    questions: [
      { formula: 'NaCl', name: '塩化ナトリウム', answer: 58 },
      { formula: 'CaCO3', name: '炭酸カルシウム', answer: 100 },
      { formula: 'Mg(OH)2', name: '水酸化マグネシウム', answer: 58 }
    ]
  },
  3: {
    atomicMasses: { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, Si: 28, P: 31, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56 },
    questions: [
      { formula: 'Al2O3', name: '酸化アルミニウム', answer: 102 },
      { formula: 'Fe2O3', name: '酸化鉄(III)', answer: 160 },
      { formula: 'Na2CO3', name: '炭酸ナトリウム', answer: 106 }
    ]
  },
  4: {
    atomicMasses: { H: 1, C: 12, N: 14, O: 16, Mg: 24, Al: 27, Si: 28, P: 31, S: 32, K: 39, Ca: 40, Mn: 55, Fe: 56 },
    questions: [
      { formula: 'Mn3Al2(SiO4)3', name: '満礬柘榴石', answer: 495 },
      { formula: 'Ca3Al2(SiO4)3', name: '灰礬柘榴石', answer: 450 },
      { formula: 'KAlSi3O8', name: 'カリ長石', answer: 278 }
    ]
  }
};

const $ = (id) => document.getElementById(id);
const screens = ['home-screen', 'game-screen', 'result-screen'];
let game = null;
let inputValue = '';
let timerInterval = null;

function showScreen(id) {
  screens.forEach(screenId => $(screenId).classList.toggle('hidden', screenId !== id));
}
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds - minutes * 60;
  return `${minutes}:${remainder.toFixed(2).padStart(5, '0')}`;
}
function elapsedQuestionSeconds() {
  return Math.floor((Date.now() - game.questionStartedAt) / 1000);
}
function renderAtomicList(target, masses) {
  target.innerHTML = '';
  Object.entries(masses).forEach(([symbol, mass]) => {
    const row = document.createElement('div');
    row.className = 'atomic-row';
    const symbolCell = document.createElement('span');
    const massCell = document.createElement('span');
    symbolCell.textContent = symbol;
    massCell.textContent = mass;
    row.append(symbolCell, massCell);
    target.appendChild(row);
  });
}
function renderLevelCards() {
  $('level-cards').innerHTML = '';
  for (let level = 1; level <= 4; level++) {
    const best = Number(localStorage.getItem(`formula-game-best-${level}`) || 0);
    const card = document.createElement('button');
    card.className = `level-card level-${level}`;
    card.innerHTML = `<strong>Level　${level}</strong><small>High Score：${best}</small><span class="best">${best ? rankFor(best, theoreticalTotal(level)) : '—'}</span>`;
    card.addEventListener('click', () => startGame(level));
    $('level-cards').appendChild(card);
  }
}
function theoreticalPerQuestion(level) { return 230 * (level * level + level); }
function theoreticalTotal(level) { return theoreticalPerQuestion(level) * GAME_DATA[level].questions.length; }
function rankFor(score, theoretical) {
  const ratio = theoretical > 0 ? score / theoretical : 0;
  if (ratio >= .70) return 'S';
  if (ratio >= .55) return 'A';
  if (ratio >= .45) return 'B';
  if (ratio >= .30) return 'C';
  if (ratio >= .15) return 'D';
  return 'E';
}
function startGame(level) {
  const data = GAME_DATA[level];
  game = { level, questions: data.questions, index: 0, score: 0, totalMiss: 0, totalTime: 0, correct: 0, questionMiss: 0, questionStartedAt: Date.now() };
  renderAtomicList($('atomic-list'), data.atomicMasses);
  $('game-level').textContent = `Level ${level}`;
  showScreen('game-screen');
  loadQuestion();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 100);
}
function loadQuestion() {
  const question = game.questions[game.index];
  inputValue = '';
  game.questionMiss = 0;
  game.questionStartedAt = Date.now();
  $('question-number').textContent = `問 ${game.index + 1}`;
  $('compound').innerHTML = question.formula.replace(/([A-Z][a-z]?)(\d+)/g, '$1<sub>$2</sub>').replace(/\)(\d+)/g, ')<sub>$1</sub>');
  $('compound-name').textContent = question.name || '';
  $('current-score').textContent = game.score;
  $('answer-display').textContent = '　';
  $('feedback').textContent = '';
  $('feedback').className = 'feedback';
  $('question-timer').textContent = '0:00.00';
}
function updateTimer() {
  if (!game) return;
  const seconds = (Date.now() - game.questionStartedAt) / 1000;
  $('question-timer').textContent = formatTime(seconds);
}
function updateInput() { $('answer-display').textContent = inputValue || '　'; }
function handleKey(key) {
  if (key === 'clear') inputValue = '';
  else if (key === 'back') inputValue = inputValue.slice(0, -1);
  else if (/^\d$/.test(key) && inputValue.length < 8) inputValue += key;
  updateInput();
}
function submitAnswer() {
  if (!game || inputValue === '') {
    $('feedback').textContent = '式量を入力してください';
    $('feedback').className = 'feedback error';
    return;
  }
  const question = game.questions[game.index];
  if (Number(inputValue) !== Number(question.answer)) {
    game.questionMiss++;
    game.totalMiss++;
    $('feedback').textContent = '不正解';
    $('feedback').className = 'feedback error';
    inputValue = '';
    updateInput();
    return;
  }
  const seconds = elapsedQuestionSeconds();
  game.totalTime += seconds;
  const level = game.level;
  const rawPoints = 230 * (level * level + level) - 100 * level * game.questionMiss - 5 * level * seconds;
  const points = Math.max(10 * level, Math.round(rawPoints));
  game.score += points;
  game.correct++;
  $('feedback').textContent = `正解！ +${points}点`;
  $('feedback').className = 'feedback success';
  $('current-score').textContent = game.score;
  if (game.index + 1 < game.questions.length) {
    game.index++;
    setTimeout(() => { if (game) loadQuestion(); }, 650);
  } else {
    setTimeout(finishGame, 650);
  }
}
function finishGame() {
  clearInterval(timerInterval);
  const level = game.level;
  const theoretical = theoreticalTotal(level);
  const rank = rankFor(game.score, theoretical);
  const bestKey = `formula-game-best-${level}`;
  const oldBest = Number(localStorage.getItem(bestKey) || 0);
  if (game.score > oldBest) localStorage.setItem(bestKey, String(game.score));
  $('result-level').textContent = `Level ${level}`;
  $('result-score').textContent = game.score;
  $('result-time').textContent = formatTime(game.totalTime);
  $('result-miss').textContent = game.totalMiss;
  $('result-correct').textContent = `${game.correct} / ${game.questions.length}`;
  $('result-rank').textContent = rank;
  $('rank-detail').textContent = `理論値 ${theoretical}点に対して ${(game.score / theoretical * 100).toFixed(1)}%`;
  showScreen('result-screen');
  game = null;
}
function quitGame() {
  if (!game) return;
  if (!confirm('ゲームを終了してホームに戻りますか？今回のスコアは保存されません。')) return;
  clearInterval(timerInterval);
  game = null;
  renderLevelCards();
  showScreen('home-screen');
}

// Keypad controls
document.querySelector('.keypad').addEventListener('click', event => {
  const key = event.target.closest('[data-key]')?.dataset.key;
  if (key) handleKey(key);
});
$('submit-answer').addEventListener('click', submitAnswer);
document.addEventListener('keydown', event => {
  if ($('game-screen').classList.contains('hidden')) return;
  if (/^\d$/.test(event.key)) handleKey(event.key);
  else if (event.key === 'Backspace') handleKey('back');
  else if (event.key === 'Escape') handleKey('clear');
  else if (event.key === 'Enter') submitAnswer();
});
$('quit-button').addEventListener('click', quitGame);
$('back-home-button').addEventListener('click', () => { renderLevelCards(); showScreen('home-screen'); });
$('atomic-list-button').addEventListener('click', () => {
  renderAtomicList($('all-atomic-list'), COMMON_ATOMIC_MASSES);
  $('atomic-modal').classList.remove('hidden');
});
$('close-modal').addEventListener('click', () => $('atomic-modal').classList.add('hidden'));
$('atomic-modal').addEventListener('click', event => { if (event.target === $('atomic-modal')) $('atomic-modal').classList.add('hidden'); });
renderLevelCards();
