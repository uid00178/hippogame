// game.js (hippo + sprite)
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// SVG data (вставлен как data URL)
const hippoSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="#F6D66A" rx="20" />
  <ellipse cx="128" cy="150" rx="88" ry="56" fill="#B48BC8"/>
  <ellipse cx="128" cy="96" rx="56" ry="44" fill="#C99FE0"/>
  <ellipse cx="92" cy="66" rx="10" ry="12" fill="#C99FE0"/>
  <ellipse cx="164" cy="66" rx="10" ry="12" fill="#C99FE0"/>
  <circle cx="112" cy="90" r="6" fill="#2B2B2B"/>
  <circle cx="144" cy="90" r="6" fill="#2B2B2B"/>
  <ellipse cx="120" cy="108" rx="6" ry="4" fill="#8E5B8E"/>
  <ellipse cx="136" cy="108" rx="6" ry="4" fill="#8E5B8E"/>
  <path d="M104 118 Q128 132 152 118" stroke="#8E5B8E" stroke-width="4" fill="none" stroke-linecap="round"/>
  <ellipse cx="96" cy="104" rx="8" ry="6" fill="#E9BDEB" opacity="0.6"/>
  <ellipse cx="160" cy="104" rx="8" ry="6" fill="#E9BDEB" opacity="0.6"/>
  <rect x="92" y="184" width="24" height="18" rx="6" fill="#A678B2"/>
  <rect x="140" y="184" width="24" height="18" rx="6" fill="#A678B2"/>
</svg>`;

// Создаём Image из SVG data URL
const hippoImg = new Image();
hippoImg.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(hippoSVG);

// Игра
let hippo = {
  x: 60,
  y: canvas.height / 2,
  size: 64,          // базовый размер спрайта (будем масштабировать)
  gravity: 0.45,
  lift: -9,
  velocity: 0,
};

let pipes = [];
let pipeGap = Math.max(140, Math.floor(canvas.height * 0.28));
let pipeWidth = Math.max(60, Math.floor(canvas.width * 0.09));
let frame = 0;
let score = 0;
let running = true;
let speed = 3;

window.addEventListener("touchstart", handleTap);
window.addEventListener("mousedown", handleTap);

function handleTap(e) {
  e.preventDefault();
  if (!running) {
    restartGame();
  } else {
    hippo.velocity = hippo.lift;
  }
}

function update() {
  if (!running) return;

  hippo.velocity += hippo.gravity;
  hippo.y += hippo.velocity;

  // Границы
  if (hippo.y + hippo.size > canvas.height) {
    hippo.y = canvas.height - hippo.size;
    // проигрыш
    endGame();
  }
  if (hippo.y < 0) {
    hippo.y = 0;
    hippo.velocity = 0;
  }

  // Спавн препятствий
  if (frame % 100 === 0) {
    let topHeight = Math.random() * (canvas.height - pipeGap - 80) + 40;
    pipes.push({
      x: canvas.width,
      top: topHeight,
      bottom: topHeight + pipeGap,
      passed: false
    });
  }

  // Обновляем препятствия
  pipes.forEach((p, i) => {
    p.x -= speed;

    // Столкновение (приближённая коллизия AABB)
    let hippoRect = {x: hippo.x, y: hippo.y, w: hippo.size, h: hippo.size};
    let pipeTopRect = {x: p.x, y: 0, w: pipeWidth, h: p.top};
    let pipeBottomRect = {x: p.x, y: p.bottom, w: pipeWidth, h: canvas.height - p.bottom};

    if (rectIntersect(hippoRect, pipeTopRect) || rectIntersect(hippoRect, pipeBottomRect)) {
      endGame();
    }

    // Подсчёт очков
    if (!p.passed && p.x + pipeWidth < hippo.x) {
      p.passed = true;
      score++;
      // можно добавить звуковой эффект
    }

    // Удаляем ушедшие обьекты
    if (p.x + pipeWidth < -50) {
      pipes.splice(i, 1);
    }
  });

  frame++;
}

function rectIntersect(a, b) {
  return !(b.x > a.x + a.w || b.x + b.w < a.x || b.y > a.y + a.h || b.y + b.h < a.y);
}

function draw() {
  // фон саванны
  ctx.fillStyle = "#F6D66A";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // нарисуем землю-линию
  ctx.fillStyle = "#E2B85A";
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

  // рисуем препятствия (тростник)
  ctx.fillStyle = "#8BBF4A";
  pipes.forEach((p) => {
    // верхний тростник
    ctx.fillRect(p.x, 0, pipeWidth, p.top);
    // нижний тростник
    ctx.fillRect(p.x, p.bottom, pipeWidth, canvas.height - p.bottom);
    // немного деталей (листья)
    ctx.fillStyle = "#6FA23A";
    ctx.fillRect(p.x - 6, 0, 6, Math.min(80, p.top));
    ctx.fillRect(p.x - 6, p.bottom, 6, Math.min(80, canvas.height - p.bottom));
    ctx.fillStyle = "#8BBF4A";
  });

  // рисуем бегемота — если изображение загружено, рисуем изображение, иначе прямоуголник
  if (hippoImg.complete && hippoImg.naturalWidth !== 0) {
    // масштабируем спрайт по размеру hippo.size
    ctx.drawImage(hippoImg, hippo.x, hippo.y, hippo.size, hippo.size);
  } else {
    // fallback
    ctx.fillStyle = "#B48BC8";
    ctx.fillRect(hippo.x, hippo.y, hippo.size, hippo.size);
  }

  // Счёт
  ctx.fillStyle = "#ffffff";
  ctx.font = "28px Arial";
  ctx.fillText("Score: " + score, 20, 40);

  if (!running) {
    // overlay
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Игра окончена", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "24px Arial";
    ctx.fillText("Тап — рестарт", canvas.width / 2, canvas.height / 2 + 20);
    ctx.textAlign = "start";
  }
}

function endGame() {
  running = false;
  // Показываем alert Telegram WebApp, если есть
  try {
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.showAlert) {
      Telegram.WebApp.showAlert("Игра окончена! Счёт: " + score);
    }
  } catch (e) {}
}

function restartGame() {
  pipes = [];
  score = 0;
  frame = 0;
  hippo.y = canvas.height / 2;
  hippo.velocity = 0;
  running = true;
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
