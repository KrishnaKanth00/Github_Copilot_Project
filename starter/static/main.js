// Client-side rendering and interaction for the Flask-backed Sudoku
const SIZE = 9;
const LEADERBOARD_KEY = 'sudoku-top-10';
let puzzle = [];
let timerStart = null;
let timerInterval = null;
let hintsUsed = 0;
let incorrectHighlightTimeout = null;
let statusMessageTimeout = null;
const hintPalette = new Map();

function getLeaderboardEntries() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveLeaderboardEntries(entries) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

function renderLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  if (!list) return;

  list.innerHTML = '';
  const entries = getLeaderboardEntries();

  if (entries.length === 0) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'leaderboard-empty';
    emptyItem.textContent = 'No scores yet.';
    list.appendChild(emptyItem);
    return;
  }

  const sortedEntries = [...entries].sort((a, b) => {
    if (a.seconds !== b.seconds) {
      return a.seconds - b.seconds;
    }
    return a.hintsUsed - b.hintsUsed;
  }).slice(0, 10);

  for (let index = 0; index < sortedEntries.length; index += 1) {
    const entry = sortedEntries[index];
    const item = document.createElement('li');
    item.className = 'leaderboard-item';
    item.innerHTML = `
      <span class="leaderboard-rank">${index + 1}.</span>
      <span class="leaderboard-name">${entry.name}</span>
      <span class="leaderboard-time">${entry.time}</span>
      <span class="leaderboard-hints">Hints: ${entry.hintsUsed}</span>
      <span class="leaderboard-difficulty">${entry.difficulty}</span>
    `;
    list.appendChild(item);
  }
}

function saveTopScore(name, seconds) {
  const difficulty = document.getElementById('difficulty-select').value;
  const entry = {
    name: name || 'Player',
    seconds,
    time: formatTime(seconds),
    hintsUsed,
    difficulty,
  };

  const entries = getLeaderboardEntries();
  entries.push(entry);
  saveLeaderboardEntries(entries.slice(0, 10).sort((a, b) => {
    if (a.seconds !== b.seconds) {
      return a.seconds - b.seconds;
    }
    return a.hintsUsed - b.hintsUsed;
  }));
  renderLeaderboard();
}

function applyTheme(theme) {
  const body = document.body;
  const toggle = document.getElementById('theme-toggle');
  const isDark = theme === 'dark';

  body.classList.toggle('dark-mode', isDark);
  if (toggle) {
    toggle.textContent = isDark ? 'Dark mode' : 'Light mode';
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  localStorage.setItem('sudoku-theme', theme);
}

function initializeTheme() {
  const stored = localStorage.getItem('sudoku-theme');
  applyTheme(stored === 'dark' ? 'dark' : 'light');
}

function getHintColor(row, col) {
  const key = `${row},${col}`;
  if (!hintPalette.has(key)) {
    const hue = (row * 47 + col * 31) % 360;
    hintPalette.set(key, `hsl(${hue} 72% 82%)`);
  }
  return hintPalette.get(key);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateTimer() {
  const timerEl = document.getElementById('timer');
  if (!timerStart) {
    timerEl.innerText = 'Time: 00:00';
    return;
  }

  const elapsedSeconds = (Date.now() - timerStart) / 1000;
  timerEl.innerText = `Time: ${formatTime(elapsedSeconds)}`;
}

function startTimer(startTimestamp) {
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  timerStart = startTimestamp ? startTimestamp * 1000 : Date.now();
  updateTimer();
  timerInterval = setInterval(updateTimer, 1000);
}

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';
  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/[^1-9]/g, '');
        e.target.value = val;
        updateInvalidCellStyles();
      });
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function updateInvalidCellStyles() {
  const inputs = Array.from(document.querySelectorAll('.sudoku-cell'));
  const invalidCells = new Set();

  for (const input of inputs) {
    const value = input.value.trim();
    if (value === '') continue;

    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    const currentValue = Number(value);

    for (const other of inputs) {
      if (other === input) continue;
      if (other.value.trim() === '') continue;

      const otherRow = Number(other.dataset.row);
      const otherCol = Number(other.dataset.col);
      const otherValue = Number(other.value);

      const sameRow = row === otherRow;
      const sameCol = col === otherCol;
      const sameBox = Math.floor(row / 3) === Math.floor(otherRow / 3) && Math.floor(col / 3) === Math.floor(otherCol / 3);

      if ((sameRow || sameCol || sameBox) && currentValue === otherValue) {
        invalidCells.add(input);
        invalidCells.add(other);
      }
    }
  }

  for (const input of inputs) {
    input.classList.toggle('invalid', invalidCells.has(input));
  }
}

function renderPuzzle(puz) {
  puzzle = puz;
  hintPalette.clear();
  createBoardElement();
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = puzzle[i][j];
      const inp = inputs[idx];
      inp.className = 'sudoku-cell';
      inp.style.backgroundColor = '';
      inp.classList.remove('invalid');
      if (val !== 0) {
        inp.value = val;
        inp.disabled = true;
        inp.className += ' prefilled';
      } else {
        inp.value = '';
        inp.disabled = false;
      }
    }
  }
}

function clearIncorrectHighlights() {
  const boardDiv = document.getElementById('sudoku-board');
  if (!boardDiv) return;

  const inputs = boardDiv.getElementsByTagName('input');
  for (let idx = 0; idx < inputs.length; idx += 1) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    inp.style.backgroundColor = '';
  }
}

function clearStatusMessage() {
  const msg = document.getElementById('message');
  if (!msg) return;
  msg.innerText = '';
  msg.style.color = '';
}

function showStatusMessage(text, color, clearAfterMs = 3000) {
  const msg = document.getElementById('message');
  if (!msg) return;

  if (statusMessageTimeout) {
    clearTimeout(statusMessageTimeout);
    statusMessageTimeout = null;
  }

  msg.style.color = color;
  msg.innerText = text;

  if (clearAfterMs > 0) {
    statusMessageTimeout = setTimeout(() => {
      clearStatusMessage();
      statusMessageTimeout = null;
    }, clearAfterMs);
  }
}

function openCompletionModal(completionTime, completionMessage) {
  const modal = document.getElementById('completion-modal');
  const text = document.getElementById('completion-text');
  const nameInput = document.getElementById('player-name');

  if (!modal || !text || !nameInput) return;

  text.dataset.time = String(completionTime);
  text.textContent = `${completionMessage} How long did you take? ${formatTime(completionTime)} with ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'}.`;
  nameInput.value = '';
  nameInput.focus();
  modal.classList.remove('hidden');
}

function closeCompletionModal() {
  const modal = document.getElementById('completion-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

async function newGame() {
  hintsUsed = 0;
  closeCompletionModal();
  if (incorrectHighlightTimeout) {
    clearTimeout(incorrectHighlightTimeout);
    incorrectHighlightTimeout = null;
  }
  clearIncorrectHighlights();
  const difficulty = document.getElementById('difficulty-select').value;
  const res = await fetch(`/new?difficulty=${encodeURIComponent(difficulty)}`);
  const data = await res.json();
  renderPuzzle(data.puzzle);
  startTimer(data.started_at || Date.now() / 1000);
  clearStatusMessage();
}

async function checkSolution() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const board = [];
  for (let i = 0; i < SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < SIZE; j++) {
      const idx = i * SIZE + j;
      const val = inputs[idx].value;
      board[i][j] = val ? parseInt(val, 10) : 0;
    }
  }
  const res = await fetch('/check', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({board})
  });
  const data = await res.json();
  if (data.error) {
    showStatusMessage(data.error, '#d32f2f', 3000);
    return;
  }
  const incorrect = new Set(data.incorrect.map(x => x[0]*SIZE + x[1]));
  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (inp.disabled) continue;
    inp.className = 'sudoku-cell';
    inp.style.backgroundColor = '';
    if (incorrect.has(idx)) {
      inp.className = 'sudoku-cell incorrect';
    }
  }

  const hasEmptyCell = Array.from(inputs).some((inp) => !inp.disabled && inp.value === '');
  if (incorrect.size === 0 && !hasEmptyCell) {
    const completionTime = Math.max(0, Math.round(data.elapsed_seconds));
    const hintText = hintsUsed === 1 ? 'hint' : 'hints';
    const completionMessage = `Congratulations! You solved it in ${formatTime(data.elapsed_seconds)} with ${hintsUsed} ${hintText}.`;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    openCompletionModal(completionTime, completionMessage);
    return;
  } else {
    showStatusMessage(`Some cells are incorrect. Time: ${formatTime(data.elapsed_seconds)}.`, '#d32f2f', 3000);
    if (incorrectHighlightTimeout) {
      clearTimeout(incorrectHighlightTimeout);
    }
    incorrectHighlightTimeout = setTimeout(() => {
      clearIncorrectHighlights();
      incorrectHighlightTimeout = null;
    }, 3000);
  }
}

async function giveHint() {
  const boardDiv = document.getElementById('sudoku-board');
  const inputs = boardDiv.getElementsByTagName('input');
  const emptyCells = [];

  for (let idx = 0; idx < inputs.length; idx++) {
    const inp = inputs[idx];
    if (!inp.disabled && inp.value === '') {
      emptyCells.push(inp);
    }
  }

  if (emptyCells.length === 0) {
    showStatusMessage('No empty cells left for a hint.', '#2e7d32', 3000);
    return;
  }

  const target = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);

  const response = await fetch('/hint', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({row, col})
  });
  const data = await response.json();
  const msg = document.getElementById('message');

  if (data.error) {
    showStatusMessage(data.error, '#d32f2f', 3000);
    return;
  }

  const input = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
  if (input) {
    puzzle[row][col] = data.value;
    input.value = data.value;
    input.disabled = true;
    input.className = 'sudoku-cell hint';
    input.style.backgroundColor = getHintColor(row, col);
  }

  hintsUsed += 1;
  showStatusMessage(`Hint: row ${row + 1}, column ${col + 1} is ${data.value}.`, '#2e7d32', 3000);
}

// Wire buttons
window.addEventListener('load', () => {
  initializeTheme();
  renderLeaderboard();

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

  const newGameButton = document.getElementById('new-game');
  const checkButton = document.getElementById('check-puzzle');
  const hintButton = document.getElementById('hint-button');
  const saveScoreButton = document.getElementById('save-score');

  if (newGameButton) {
    newGameButton.addEventListener('click', newGame);
  }
  if (checkButton) {
    checkButton.addEventListener('click', checkSolution);
  }
  if (hintButton) {
    hintButton.addEventListener('click', giveHint);
  }
  if (saveScoreButton) {
    saveScoreButton.addEventListener('click', () => {
      const nameInput = document.getElementById('player-name');
      const modal = document.getElementById('completion-modal');
      const completionText = document.getElementById('completion-text');
      const cleanName = (nameInput?.value || '').trim() || 'Player';
      const completionTime = Number(completionText?.dataset.time || 0);

      saveTopScore(cleanName, completionTime);
      closeCompletionModal();
      showStatusMessage(`${cleanName} is on the Top 10 board.`, '#388e3c', 4000);
    });
  }

  // initialize
  newGame();
});