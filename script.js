/* 式量計算ゲーム：問題候補はカテゴリ別に登録し、各プレイで重複なしに抽選する */
const COMMON_ATOMIC_MASSES = {
  H: 1, C: 12, N: 14, O: 16, F: 19, Na: 23, Mg: 24, Al: 27,
  P: 31, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56, Ni: 59,
  Cu: 63.5, Zn: 65, Br: 80, Sr: 88, Rb: 85.5, Ag: 108, I: 127
};

// 物質の存在・安定性を考慮したLevel 1の候補。式量は原子量から自動計算。
// HCO^- は HCO3^-、HSO4^2- は HSO4^- と解釈。
const LEVEL1_POOLS = {
  A: [
    ['HCl','塩化水素'], ['H2O','水'], ['H2SO4','硫酸'],
    ['NaCl','塩化ナトリウム'], ['MgCl2','塩化マグネシウム'], ['KCl','塩化カリウム'],
    ['CaCl2','塩化カルシウム'], ['AlCl3','塩化アルミニウム'],
    ['Na2O','酸化ナトリウム'], ['MgO','酸化マグネシウム'], ['CaO','酸化カルシウム'], ['Al2O3','酸化アルミニウム'],
    ['NaOH','水酸化ナトリウム'], ['KOH','水酸化カリウム'], ['Mg(OH)2','水酸化マグネシウム'],
    ['Ca(OH)2','水酸化カルシウム'], ['Al(OH)3','水酸化アルミニウム'],
    ['Na2CO3','炭酸ナトリウム'], ['K2CO3','炭酸カリウム'], ['MgCO3','炭酸マグネシウム'], ['CaCO3','炭酸カルシウム'],
    ['NaHCO3','炭酸水素ナトリウム'], ['KHCO3','炭酸水素カリウム'],
    ['Na2SO4','硫酸ナトリウム'], ['MgSO4','硫酸マグネシウム'], ['K2SO4','硫酸カリウム'],
    ['CaSO4','硫酸カルシウム'], ['Al2(SO4)3','硫酸アルミニウム']
  ],
  B: [
    ['HBr','臭化水素'], ['HF','フッ化水素'], ['CH3COOH','酢酸'],
    ['NaBr','臭化ナトリウム'], ['KBr','臭化カリウム'], ['CaBr2','臭化カルシウム'], ['MgBr2','臭化マグネシウム'],
    ['AlBr3','臭化アルミニウム'], ['CuBr2','臭化銅(II)'], ['SrBr2','臭化ストロンチウム'], ['NH4Br','臭化アンモニウム'],
    ['NaF','フッ化ナトリウム'], ['KF','フッ化カリウム'], ['MgF2','フッ化マグネシウム'], ['CaF2','フッ化カルシウム'],
    ['AlF3','フッ化アルミニウム'], ['SrF2','フッ化ストロンチウム'], ['RbF','フッ化ルビジウム'],
    ['NaHSO4','硫酸水素ナトリウム'], ['KHSO4','硫酸水素カリウム'], ['NH4HSO4','硫酸水素アンモニウム'],
    ['CH3COONa','酢酸ナトリウム'], ['CH3COOK','酢酸カリウム'], ['CH3COONH4','酢酸アンモニウム'],
    ['Mg(CH3COO)2','酢酸マグネシウム'], ['Ca(CH3COO)2','酢酸カルシウム'], ['Cu(CH3COO)2','酢酸銅(II)'],
  ],
  C: [
    // Bから移動した、Sr・Rb・Cu・NH4の塩
    ['SrCl2','塩化ストロンチウム'], ['RbCl','塩化ルビジウム'], ['CuCl2','塩化銅(II)'], ['NH4Cl','塩化アンモニウム'],
    ['SrO','酸化ストロンチウム'], ['Rb2O','酸化ルビジウム'], ['CuO','酸化銅(II)'],
    ['Sr(OH)2','水酸化ストロンチウム'], ['RbOH','水酸化ルビジウム'], ['Cu(OH)2','水酸化銅(II)'],
    ['SrCO3','炭酸ストロンチウム'], ['Rb2CO3','炭酸ルビジウム'], ['(NH4)2CO3','炭酸アンモニウム'],
    ['RbHCO3','炭酸水素ルビジウム'], ['NH4HCO3','炭酸水素アンモニウム'],
    ['SrSO4','硫酸ストロンチウム'], ['Rb2SO4','硫酸ルビジウム'], ['CuSO4','硫酸銅(II)'], ['(NH4)2SO4','硫酸アンモニウム'],
    ['HI','ヨウ化水素'], ['H3PO4','リン酸'], ['NaI','ヨウ化ナトリウム'], ['KI','ヨウ化カリウム'], ['MgI2','ヨウ化マグネシウム'], ['CaI2','ヨウ化カルシウム'],
    ['AlI3','ヨウ化アルミニウム'], ['FeI2','ヨウ化鉄(II)'], ['ZnI2','ヨウ化亜鉛'],
    ['NiI2','ヨウ化ニッケル(II)'], ['AgI','ヨウ化銀'],
    ['Na2SO3','亜硫酸ナトリウム'], ['K2SO3','亜硫酸カリウム'], ['(NH4)2SO3','亜硫酸アンモニウム'],
    ['MgSO3','亜硫酸マグネシウム'], ['CaSO3','亜硫酸カルシウム'], ['ZnSO3','亜硫酸亜鉛'],
    ['Na3PO4','リン酸ナトリウム'], ['K3PO4','リン酸カリウム'], ['Ca3(PO4)2','リン酸カルシウム'],
    ['Mg3(PO4)2','リン酸マグネシウム'], ['AlPO4','リン酸アルミニウム'], ['FePO4','リン酸鉄(III)'],
    ['Fe3(PO4)2','リン酸鉄(II)'], ['Zn3(PO4)2','リン酸亜鉛'], ['Ag3PO4','リン酸銀'],
    ['FeCl2','塩化鉄(II)'], ['FeCl3','塩化鉄(III)'], ['ZnCl2','塩化亜鉛'], ['NiCl2','塩化ニッケル(II)'],
    ['AgCl','塩化銀'], ['FeBr2','臭化鉄(II)'], ['FeBr3','臭化鉄(III)'], ['ZnBr2','臭化亜鉛'],
    ['NiBr2','臭化ニッケル(II)'], ['AgBr','臭化銀'], ['FeF2','フッ化鉄(II)'], ['ZnF2','フッ化亜鉛'],
    ['NiF2','フッ化ニッケル(II)'], ['AgF','フッ化銀'],
    ['FeSO4','硫酸鉄(II)'], ['Fe2(SO4)3','硫酸鉄(III)'], ['ZnSO4','硫酸亜鉛'], ['NiSO4','硫酸ニッケル(II)'],
    ['Ag2SO4','硫酸銀'], ['Fe(OH)2','水酸化鉄(II)'], ['Fe(OH)3','水酸化鉄(III)'],
    ['Zn(OH)2','水酸化亜鉛'], ['Ni(OH)2','水酸化ニッケル(II)'], ['Ag2O','酸化銀(I)']
  ]
};

const GAME_DATA = {
  1: { atomicMasses: COMMON_ATOMIC_MASSES, categoryCounts: { A: 2, B: 2, C: 1 } },
  2: { atomicMasses: {}, questions: [] },
  3: { atomicMasses: {}, questions: [] },
  4: { atomicMasses: {}, questions: [] }
};

function parseFormula(formula) {
  const tokens = formula.match(/[A-Z][a-z]?|\d+|\(|\)/g) || [];
  let i = 0;
  function group() {
    const counts = {};
    while (i < tokens.length && tokens[i] !== ')') {
      if (tokens[i] === '(') {
        i++;
        const inner = group();
        if (tokens[i] !== ')') throw new Error(`括弧が対応していません: ${formula}`);
        i++;
        const multiplier = /^\d+$/.test(tokens[i] || '') ? Number(tokens[i++]) : 1;
        Object.entries(inner).forEach(([el,n]) => counts[el] = (counts[el] || 0) + n * multiplier);
      } else if (/^[A-Z]/.test(tokens[i])) {
        const el = tokens[i++];
        const n = /^\d+$/.test(tokens[i] || '') ? Number(tokens[i++]) : 1;
        counts[el] = (counts[el] || 0) + n;
      } else throw new Error(`化学式を解析できません: ${formula}`);
    }
    return counts;
  }
  const counts = group();
  if (i !== tokens.length) throw new Error(`化学式を解析できません: ${formula}`);
  const mass = Object.entries(counts).reduce((sum,[el,n]) => {
    if (!(el in COMMON_ATOMIC_MASSES)) throw new Error(`原子量未登録: ${el}`);
    return sum + COMMON_ATOMIC_MASSES[el] * n;
  }, 0);
  return Math.round(mass * 10) / 10;
}
function sampleWithoutReplacement(items, count) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count).map(([formula,name]) => ({ formula, name, answer: parseFormula(formula) }));
}
function makeLevelQuestions(level) {
  if (level !== 1) return GAME_DATA[level].questions || [];
  return ['A','B','C'].flatMap(category => sampleWithoutReplacement(LEVEL1_POOLS[category], GAME_DATA[1].categoryCounts[category]));
}

const $ = (id) => document.getElementById(id);
const screens = ['home-screen', 'game-screen', 'result-screen'];
let game = null, inputValue = '', timerInterval = null, questionTimeout = null;
function showScreen(id) { screens.forEach(s => $(s).classList.toggle('hidden', s !== id)); }
function formatTime(seconds) { const m = Math.floor(seconds / 60), r = seconds - m * 60; return `${m}:${r.toFixed(2).padStart(5,'0')}`; }
function elapsedQuestionSeconds() { return (Date.now() - game.questionStartedAt) / 1000; }
function renderAtomicList(target, masses) {
  target.innerHTML = '';
  Object.entries(masses).forEach(([symbol,mass]) => {
    const row = document.createElement('div'); row.className = 'atomic-row';
    const a = document.createElement('span'), b = document.createElement('span');
    a.textContent = symbol; b.textContent = mass; row.append(a,b); target.appendChild(row);
  });
}
function theoreticalPerQuestion(level) { return 230 * (level * level + level); }
function theoreticalTotal(level) { return theoreticalPerQuestion(level) * gameQuestionCount(level); }
function gameQuestionCount(level) { return level === 1 ? 5 : (GAME_DATA[level].questions || []).length; }
function rankFor(score,theoretical) {
  const r = theoretical ? score / theoretical : 0;
  if (r >= .70) return 'S'; if (r >= .55) return 'A'; if (r >= .45) return 'B';
  if (r >= .30) return 'C'; if (r >= .15) return 'D'; return 'E';
}
function renderLevelCards() {
  $('level-cards').innerHTML = '';
  for (let level=1; level<=4; level++) {
    const best = Number(localStorage.getItem(`formula-game-best-${level}`) || 0);
    const card = document.createElement('button'); card.className = `level-card level-${level}`;
    const available = level === 1;
    card.disabled = !available;
    card.innerHTML = `<strong>Level　${level}</strong><small>${available ? `High Score：${best}` : '準備中'}</small><span class="best">${available ? (best ? rankFor(best, theoreticalPerQuestion(level)*5) : '—') : '—'}</span>`;
    if (available) card.addEventListener('click', () => startGame(level));
    $('level-cards').appendChild(card);
  }
}
function startGame(level) {
  const questions = makeLevelQuestions(level);
  game = { level, questions, index:0, score:0, totalMiss:0, totalTime:0, correct:0, passCount:0, questionMiss:0, carryMiss:0, carryTime:0, questionStartedAt:Date.now() };
  renderAtomicList($('atomic-list'), GAME_DATA[level].atomicMasses);
  $('game-level').textContent = `Level ${level}`; showScreen('game-screen'); loadQuestion();
  clearInterval(timerInterval); timerInterval = setInterval(updateTimer,100);
}
function updatePassRemaining() {
  const left = Math.max(0, 3 - game.passCount);
  $('pass-remaining').textContent = `後${left}回`;
}
function loadQuestion() {
  const q = game.questions[game.index]; inputValue = ''; game.questionMiss = 0; game.answered = false; game.questionStartedAt = Date.now();
  $('question-number').textContent = `問 ${game.index+1}`;
  updatePassRemaining();
  $('compound').innerHTML = q.formula.replace(/([A-Z][a-z]?)(\d+)/g,'$1<sub>$2</sub>').replace(/\)(\d+)/g,')<sub>$1</sub>');
  $('compound-name').textContent = q.name; $('answer-display').textContent = '　';
  $('feedback').textContent = ''; $('feedback').className = 'feedback'; $('question-timer').textContent = '0:00.00';
  $('current-score').textContent = game.score; $('pass-button').classList.toggle('hidden', game.passCount >= 3 || game.questionMiss < 2); $('submit-answer').disabled = true; $('game-screen').classList.remove('effect-correct','effect-wrong');
}
function updateTimer() { if (game) $('question-timer').textContent = formatTime(game.totalTime + elapsedQuestionSeconds()); }
function updateInput() { $('answer-display').textContent = inputValue || '　'; $('submit-answer').disabled = !/^\d{1,5}(?:\.\d)?$/.test(inputValue); }
function handleKey(key) {
  if (game?.answered) return;
  if (key==='clear') inputValue=''; else if (key==='back') inputValue=inputValue.slice(0,-1);
  else if (key==='dot') {
    if (!inputValue.includes('.') && inputValue.replace('.', '').length <= 5) inputValue = (inputValue || '0') + '.';
  }
  else if (/^\d$/.test(key)) {
    const parts = inputValue.split('.');
    if (inputValue.includes('.')) {
      if (parts[1].length < 1 && parts[0].length <= 5) inputValue += key;
    } else if (inputValue.length < 5) inputValue += key;
  }
  updateInput();
}
function playAnswerEffect(kind) {
  const screen = $('game-screen');
  screen.classList.remove('effect-correct','effect-wrong');
  // Reflow restarts the short animation for consecutive answers.
  void screen.offsetWidth;
  screen.classList.add(kind === 'correct' ? 'effect-correct' : 'effect-wrong');
  setTimeout(() => screen.classList.remove('effect-correct','effect-wrong'), 320);
}
function playSound(kind) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = kind === 'correct' ? [660, 880] : [220, 150];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = kind === 'correct' ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.0001, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.12, now + i * 0.09 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.13);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now + i * 0.09); osc.stop(now + i * 0.09 + 0.14);
    });
    setTimeout(() => ctx.close(), 450);
  } catch (_) {}
}
function xpNeeded(rank) {
  if (rank <= 10) return 500 * rank + 500;
  if (rank <= 50) return 300 * rank + 5500;
  if (rank <= 200) return 21000;
  return 30000;
}
function getPlayerProgress() {
  return { rank: Number(localStorage.getItem('formula-player-rank') || 1),
    xp: Number(localStorage.getItem('formula-player-xp') || 0) };
}
function submitAnswer() {
  if (game?.answered || !game) return;
  if (!/^\d{1,5}(?:\.\d)?$/.test(inputValue)) { $('feedback').textContent='整数5桁以内、必要なら小数第1位まで入力してください'; $('feedback').className='feedback error'; return; }
  const q=game.questions[game.index];
  if (Math.abs(Number(inputValue)-q.answer) > 0.0001) {
    game.questionMiss++; game.totalMiss++;
    $('feedback').textContent='不正解'; $('feedback').className='feedback error';
    playAnswerEffect('wrong'); playSound('wrong'); inputValue=''; updateInput();
    if (game.questionMiss >= 2 && game.passCount < 3) $('pass-button').classList.remove('hidden');
    return;
  }
  game.answered = true;
  const seconds=elapsedQuestionSeconds(); game.totalTime+=seconds;
  const x=game.level, y=game.questionMiss + game.carryMiss, z=seconds + game.carryTime;
  const raw=230*(x*x+x)-100*x*y-5*x*z;
  const points=Math.max(10*x,Math.round(raw)); game.score+=points; game.correct++;
  game.carryMiss=0; game.carryTime=0;
  $('feedback').textContent=`正解！ +${points}点`; $('feedback').className='feedback success'; $('current-score').textContent=game.score;
  playAnswerEffect('correct'); playSound('correct'); clearTimeout(questionTimeout);
  questionTimeout=setTimeout(()=>{ if (!game) return; if (game.index+1<game.questions.length) { game.index++; loadQuestion(); } else finishGame(); },650);
}
function passQuestion() {
  if (!game || game.answered || game.questionMiss < 2) return;
  const seconds = elapsedQuestionSeconds();
  game.totalTime += seconds;
  game.carryTime += seconds;
  game.carryMiss += game.questionMiss;
  if (game.passCount >= 3) return;
  game.passCount++;
  $('feedback').textContent = 'パスしました。失点は次の正解時に反映されます';
  $('feedback').className = 'feedback error';
  game.answered = true;
  clearTimeout(questionTimeout);
  questionTimeout = setTimeout(() => {
    if (!game) return;
    // パスした問題は飛ばさず、同じ問題をもう一度出題する。
    loadQuestion();
  }, 500);
}
function finishGame() {
  if (!game || game.finishing) return;
  game.finishing = true;
  clearInterval(timerInterval); clearTimeout(questionTimeout);
  const level=game.level, theoretical=theoreticalPerQuestion(level)*game.questions.length;
  const rank=rankFor(game.score,theoretical), key=`formula-game-best-${level}`;
  const old=Number(localStorage.getItem(key)||0); if(game.score>old)localStorage.setItem(key,String(game.score));
  $('result-level').textContent=`Level ${level}`; $('result-score').textContent=game.score;
  $('result-time').textContent=formatTime(game.totalTime); $('result-miss').textContent=game.totalMiss;
  $('result-correct').textContent=`${game.correct} / ${game.questions.length}`; $('result-pass').textContent=game.passCount; $('result-rank').textContent=rank;
  $('rank-detail').textContent='';
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
  $('player-xp').textContent = `PLAYER RANK ${progress.rank}　XP：${progress.xp} / ${xpNeeded(progress.rank)}（今回 +${gained} XP）`;
  const rankup = $('player-rankup');
  if (rankUps > 0) {
    rankup.textContent = `LEVEL UP！ プレイヤーランク ${progress.rank - rankUps} → ${progress.rank}`;
    rankup.classList.remove('hidden');
    rankup.classList.remove('rankup-animation'); void rankup.offsetWidth; rankup.classList.add('rankup-animation');
  } else {
    rankup.textContent = ''; rankup.classList.add('hidden');
  }
  const cutoffs = [['S',.70],['A',.55],['B',.45],['C',.30],['D',.15]];
  $('rank-border').textContent = cutoffs.map(([label,rate]) => `${label}：${Math.ceil(theoretical*rate)}点以上`).join('　') + `　E：${Math.ceil(theoretical*.15)-1}点以下`;
  game=null; showScreen('result-screen');
}
function quitGame() {
  if(!game || !confirm('ゲームを終了してホームに戻りますか？今回のスコアは保存されません。'))return;
  clearInterval(timerInterval); clearTimeout(questionTimeout); game=null; renderLevelCards(); showScreen('home-screen');
}
document.querySelector('.keypad').addEventListener('click',e=>{const k=e.target.closest('[data-key]')?.dataset.key;if(k)handleKey(k);});
$('submit-answer').addEventListener('click',submitAnswer);
$('pass-button').addEventListener('click',passQuestion);
document.addEventListener('keydown',e=>{if($('game-screen').classList.contains('hidden'))return;if(/^\d$/.test(e.key))handleKey(e.key);else if(e.key==='Backspace')handleKey('back');else if(e.key==='Escape')handleKey('clear');else if(e.key==='Enter')submitAnswer();});
$('quit-button').addEventListener('click',quitGame);
$('back-home-button').addEventListener('click',()=>{renderLevelCards();showScreen('home-screen');});
$('atomic-list-button').addEventListener('click',()=>{renderAtomicList($('all-atomic-list'),COMMON_ATOMIC_MASSES);$('atomic-modal').classList.remove('hidden');});
$('close-modal').addEventListener('click',()=>$('atomic-modal').classList.add('hidden'));
$('atomic-modal').addEventListener('click',e=>{if(e.target===$('atomic-modal'))$('atomic-modal').classList.add('hidden');});
renderLevelCards();
