'use strict';

// ---- 定数 ----
const PLAYER_SPEED = 6;
const PLAYER_WIDTH = 44;
const PLAYER_HEIGHT = 44;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 40;
const INITIAL_ENEMY_SPEED = 3.5;
const INITIAL_SPAWN_INTERVAL = 1400; // ms
const SPEED_INCREMENT = 0.0008;      // フレームごとの速度加算
const SPAWN_DECREMENT = 0.12;        // 秒ごとのスポーン間隔短縮(ms)
const MIN_SPAWN_INTERVAL = 400;

const GAME_OVER_MESSAGES = [
  "はい、今日も理不尽",
  "避けたのに来るタイプ",
  "これは不可避",
  "ぶつかりスキル高すぎ",
  "通勤ストレスMAX",
  "今日の被害者です",
  "なぜかあなたにだけ当たりに来る",
  "歩いてるだけでイベント発生"
];

// ---- 要素取得 ----
const screenStart    = document.getElementById('screen-start');
const screenGame     = document.getElementById('screen-game');
const screenGameover = document.getElementById('screen-gameover');
const gameArea       = document.getElementById('game-area');
const playerEl       = document.getElementById('player');
const scoreEl        = document.getElementById('score');
const finalScoreEl   = document.getElementById('final-score');
const randomMsgEl    = document.getElementById('random-message');
const btnStart       = document.getElementById('btn-start');
const btnRestart     = document.getElementById('btn-restart');
const touchLeft      = document.getElementById('touch-left');
const touchRight     = document.getElementById('touch-right');

// ---- ゲーム状態 ----
let state = 'start'; // 'start' | 'playing' | 'gameover'
let animFrameId = null;

let player = { x: 0, y: 0 };
let enemies = [];
let score = 0;
let lastTime = 0;
let spawnTimer = 0;
let spawnInterval = INITIAL_SPAWN_INTERVAL;
let enemySpeed = INITIAL_ENEMY_SPEED;

let keys = { left: false, right: false };
let touchDir = 0; // -1 | 0 | 1

// ---- 画面切替 ----
function showScreen(name) {
  screenStart.classList.remove('active');
  screenGame.classList.remove('active');
  screenGameover.classList.remove('active');
  if (name === 'start')    screenStart.classList.add('active');
  if (name === 'playing')  screenGame.classList.add('active');
  if (name === 'gameover') screenGameover.classList.add('active');
}

// ---- ゲーム初期化 ----
function initGame() {
  enemies.forEach(e => e.el.remove());
  enemies = [];
  score = 0;
  spawnInterval = INITIAL_SPAWN_INTERVAL;
  enemySpeed = INITIAL_ENEMY_SPEED;
  spawnTimer = 0;
  lastTime = 0;
  touchDir = 0;
  keys = { left: false, right: false };

  const areaW = gameArea.offsetWidth;
  player.x = areaW / 2;
  player.y = gameArea.offsetHeight - 40 - PLAYER_HEIGHT;
  updatePlayerPos();
  scoreEl.textContent = '0';
}

// ---- プレイヤー位置更新 ----
function updatePlayerPos() {
  playerEl.style.left = player.x + 'px';
  playerEl.style.bottom = '40px';
}

// ---- 敵スポーン ----
function spawnEnemy() {
  const areaW = gameArea.offsetWidth;
  const margin = ENEMY_WIDTH;
  const x = margin + Math.random() * (areaW - margin * 2);

  const el = document.createElement('div');
  el.className = 'enemy';
  el.textContent = '🚶';
  gameArea.appendChild(el);

  enemies.push({ x, y: -ENEMY_HEIGHT, el });
}

// ---- 衝突判定 ----
function checkCollision(enemy) {
  const areaH = gameArea.offsetHeight;
  const py = areaH - 40 - PLAYER_HEIGHT;

  const pl = player.x - PLAYER_WIDTH / 2;
  const pr = player.x + PLAYER_WIDTH / 2;
  const pt = py;
  const pb = py + PLAYER_HEIGHT;

  const el = enemy.x - ENEMY_WIDTH / 2;
  const er = enemy.x + ENEMY_WIDTH / 2;
  const et = enemy.y;
  const eb = enemy.y + ENEMY_HEIGHT;

  return pl < er && pr > el && pt < eb && pb > et;
}

// ---- ゲームループ ----
function gameLoop(timestamp) {
  if (state !== 'playing') return;

  const delta = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
  lastTime = timestamp;

  const areaW = gameArea.offsetWidth;
  const areaH = gameArea.offsetHeight;

  // スコア更新
  score += delta / 1000;
  scoreEl.textContent = Math.floor(score);

  // 難易度上昇
  enemySpeed += SPEED_INCREMENT * delta;
  spawnInterval = Math.max(
    MIN_SPAWN_INTERVAL,
    INITIAL_SPAWN_INTERVAL - Math.floor(score) * SPAWN_DECREMENT * 60
  );

  // プレイヤー移動
  const dir = (keys.left ? -1 : 0) + (keys.right ? 1 : 0) + touchDir;
  player.x += dir * PLAYER_SPEED;
  player.x = Math.max(PLAYER_WIDTH / 2, Math.min(areaW - PLAYER_WIDTH / 2, player.x));
  updatePlayerPos();

  // 敵スポーン
  spawnTimer += delta;
  if (spawnTimer >= spawnInterval) {
    spawnEnemy();
    spawnTimer = 0;
  }

  // 敵移動 & 判定
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.y += enemySpeed * (delta / 16);

    enemy.el.style.left = enemy.x + 'px';
    enemy.el.style.top  = enemy.y + 'px';

    if (checkCollision(enemy)) {
      triggerGameover();
      return;
    }

    if (enemy.y > areaH) {
      enemy.el.remove();
      enemies.splice(i, 1);
    }
  }

  animFrameId = requestAnimationFrame(gameLoop);
}

// ---- ゲームオーバー処理 ----
function triggerGameover() {
  state = 'gameover';
  cancelAnimationFrame(animFrameId);

  finalScoreEl.textContent = Math.floor(score);
  randomMsgEl.textContent = GAME_OVER_MESSAGES[
    Math.floor(Math.random() * GAME_OVER_MESSAGES.length)
  ];
  showScreen('gameover');
}

// ---- ゲーム開始 ----
function startGame() {
  state = 'playing';
  showScreen('playing');
  initGame();
  animFrameId = requestAnimationFrame(gameLoop);
}

// ---- イベント: ボタン ----
btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', startGame);

// ---- イベント: キーボード ----
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  keys.left  = true;
  if (e.key === 'ArrowRight') keys.right = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft')  keys.left  = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

// ---- イベント: タッチ ----
function setTouchDir(dir) { touchDir = dir; }

touchLeft.addEventListener('touchstart',  () => setTouchDir(-1), { passive: true });
touchLeft.addEventListener('touchend',    () => setTouchDir(0),  { passive: true });
touchLeft.addEventListener('touchcancel', () => setTouchDir(0),  { passive: true });

touchRight.addEventListener('touchstart',  () => setTouchDir(1), { passive: true });
touchRight.addEventListener('touchend',    () => setTouchDir(0), { passive: true });
touchRight.addEventListener('touchcancel', () => setTouchDir(0), { passive: true });
