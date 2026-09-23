/* ============================================================
   Cobrinha Neon — jogo da cobrinha moderno
   Canvas + teclado + swipe + botões de toque
   Pausa, reinício, dificuldade, recorde (localStorage)
   ============================================================ */
(() => {
  "use strict";

  // ---------- Configuração ----------
  const GRID = 20;                 // células por lado
  const HS_KEY = "cobrinha-neon-highscore";
  const SPEED_KEY = "cobrinha-neon-speed";

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const highEl = document.getElementById("highscore");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const overlayScore = document.getElementById("overlay-score");
  const btnStart = document.getElementById("btn-start");
  const btnPause = document.getElementById("btn-pause");
  const btnRestart = document.getElementById("btn-restart");
  const diffBtns = [...document.querySelectorAll(".diff-btn")];
  const boardWrap = document.querySelector(".board-wrap");

  // ---------- Estado ----------
  let cell;                        // tamanho em px de cada célula (resolvido no resize)
  let snake, dir, nextDir, food, score, speedMs, highscore;
  let state = "menu";              // menu | playing | paused | over
  let lastTick = 0;
  let eatPulse = 0;                // animação ao comer
  let deathAt = 0;

  // ---------- Pontuação / recorde ----------
  function loadHighscore() {
    const v = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
    return Number.isFinite(v) ? v : 0;
  }
  function saveHighscore(v) { localStorage.setItem(HS_KEY, String(v)); }

  function setScore(n, animate = false) {
    score = n;
    scoreEl.textContent = n;
    if (animate) {
      scoreEl.classList.remove("bump");
      void scoreEl.offsetWidth; // reinicia a animação
      scoreEl.classList.add("bump");
    }
    if (n > highscore) {
      highscore = n;
      highEl.textContent = n;
      saveHighscore(n);
    }
  }

  // ---------- Dificuldade ----------
  function setSpeed(ms, persist = true) {
    speedMs = ms;
    diffBtns.forEach((b) => b.classList.toggle("active", +b.dataset.speed === ms));
    if (persist) localStorage.setItem(SPEED_KEY, String(ms));
  }
  diffBtns.forEach((b) =>
    b.addEventListener("click", () => {
      setSpeed(+b.dataset.speed);
      if (state === "menu" || state === "over") resetGame(false);
    })
  );

  // ---------- Ciclo do jogo ----------
  function resetGame(startNow = true) {
    const mid = Math.floor(GRID / 2);
    snake = [
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
      { x: mid - 3, y: mid },
    ];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    setScore(0);
    spawnFood();
    if (startNow) {
      state = "playing";
      hideOverlay();
      updatePauseBtn();
    } else {
      state = "menu";
      showOverlay("Pronto para jogar?", "Use as setas / WASD no teclado ou deslize o dedo no tabuleiro.", "", "▶ Jogar");
    }
    lastTick = performance.now();
  }

  function spawnFood() {
    const free = [];
    for (let y = 0; y < GRID; y++)
      for (let x = 0; x < GRID; x++)
        if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
    food = free[Math.floor(Math.random() * free.length)] || { x: 0, y: 0 };
    food.born = performance.now();
  }

  function step(now) {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // colisão com parede
    if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID) return gameOver();
    // colisão consigo mesma (a cauda sai do lugar, exceto quando cresce)
    const growing = head.x === food.x && head.y === food.y;
    const body = growing ? snake : snake.slice(0, -1);
    if (body.some((s) => s.x === head.x && s.y === head.y)) return gameOver();

    snake.unshift(head);
    if (growing) {
      setScore(score + 10, true);
      eatPulse = 1;
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    state = "over";
    deathAt = performance.now();
    boardWrap.classList.remove("gameover-glow");
    void boardWrap.offsetWidth;
    boardWrap.classList.add("gameover-glow");
    const rec = score >= highscore && score > 0;
    showOverlay(
      rec ? "🏆 Novo recorde!" : "💀 Fim de jogo",
      `Você chegou a ${snake.length} ${snake.length === 1 ? "célula" : "células"}.`,
      `Pontos: <strong>${score}</strong> &nbsp;•&nbsp; Recorde: <strong>${highscore}</strong>`,
      "↻ Jogar novamente"
    );
    updatePauseBtn();
  }

  function togglePause(force) {
    if (state === "playing" && force !== false) {
      state = "paused";
      showOverlay("⏸ Pausado", "Pressione Espaço ou toque em continuar.", "", "▶ Continuar");
    } else if (state === "paused") {
      state = "playing";
      lastTick = performance.now();
      hideOverlay();
    }
    updatePauseBtn();
  }

  function updatePauseBtn() {
    btnPause.textContent = state === "paused" ? "▶" : "⏸";
    btnPause.title = state === "paused" ? "Continuar (Espaço)" : "Pausar (Espaço)";
  }

  // ---------- Overlay ----------
  function showOverlay(title, msg, scoreHtml, btnLabel) {
    overlayTitle.textContent = title;
    overlayMsg.textContent = msg;
    if (scoreHtml) {
      overlayScore.innerHTML = scoreHtml;
      overlayScore.classList.remove("hidden");
    } else {
      overlayScore.classList.add("hidden");
    }
    btnStart.textContent = btnLabel;
    overlay.classList.remove("hidden");
  }
  function hideOverlay() { overlay.classList.add("hidden"); }

  btnStart.addEventListener("click", () => {
    if (state === "paused") togglePause();
    else resetGame(true);
  });
  btnPause.addEventListener("click", () => {
    if (state === "playing" || state === "paused") togglePause();
  });
  btnRestart.addEventListener("click", () => resetGame(state === "playing" || state === "paused"));

  // ---------- Entrada: teclado ----------
  const KEY_DIRS = {
    ArrowUp: { x: 0, y: -1 }, KeyW: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 },
  };
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (state === "menu" || state === "over") resetGame(true);
      else togglePause();
      return;
    }
    if (e.code === "KeyR") { resetGame(true); return; }
    const d = KEY_DIRS[e.code];
    if (!d) return;
    e.preventDefault();
    queueDir(d);
    if (state === "menu") resetGame(true);
    else if (state === "paused") togglePause();
  });

  function queueDir(d) {
    // impede reversão de 180°
    if (d.x === -dir.x && d.y === -dir.y) return;
    nextDir = d;
  }

  // ---------- Entrada: swipe no canvas ----------
  let touchStart = null;
  canvas.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  canvas.addEventListener("touchend", (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; // toque simples
    const d = Math.abs(dx) > Math.abs(dy)
      ? { x: Math.sign(dx), y: 0 }
      : { x: 0, y: Math.sign(dy) };
    if (state === "menu" || state === "over") { resetGame(true); queueDir(d); }
    else queueDir(d);
  }, { passive: true });

  // ---------- Entrada: botões direcionais (toque) ----------
  const BTN_DIRS = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
  };
  document.querySelectorAll(".tbtn").forEach((b) => {
    b.addEventListener("click", () => {
      const d = BTN_DIRS[b.dataset.dir];
      if (!d) return;
      if (state === "menu" || state === "over") resetGame(true);
      else if (state === "paused") togglePause();
      queueDir(d);
    });
  });

  // Pausa automática ao sair da aba
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") togglePause();
  });

  // ---------- Renderização ----------
  function resize() {
    const size = canvas.clientWidth;
    if (!size) return;               // canvas ainda não medido — mantém cell anterior
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = size / GRID;
  }
  window.addEventListener("resize", resize);

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw(now) {
    const size = canvas.clientWidth;
    ctx.clearRect(0, 0, size, size);

    // fundo quadriculado sutil
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if ((x + y) % 2 === 0) continue;
        ctx.fillStyle = "rgba(255,255,255,0.018)";
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    // comida (com pulso de nascimento) — raio sempre >= 0 e centro finito,
    // para nunca lançar IndexSizeError em createRadialGradient/arc
    if (Number.isFinite(cell) && cell > 0 && food) {
      const age = Math.max(0, Math.min((now - (food.born || 0)) / 250, 1));
      const pulse = 1 + 0.12 * Math.sin(now / 260) * easeOut(age);
      const fr = Math.max(0.01, cell * 0.34 * pulse * easeOut(age));
      const fx = (food.x + 0.5) * cell;
      const fy = (food.y + 0.5) * cell;
      ctx.save();
      ctx.shadowColor = "#f87171";
      ctx.shadowBlur = 16;
      const g = ctx.createRadialGradient(fx, fy, fr * 0.2, fx, fy, fr);
      g.addColorStop(0, "#fecaca");
      g.addColorStop(1, "#ef4444");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(fx, fy, fr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // cobra — interpolação entre ticks para movimento suave (clampado em [0,1])
    const t = state === "playing"
      ? Math.max(0, Math.min((now - lastTick) / speedMs, 1))
      : 1;
    const dead = state === "over";
    const len = snake.length;

    for (let i = len - 1; i >= 0; i--) {
      const s = snake[i];
      let px = s.x, py = s.y;
      if (!dead && i === 0) {
        px += dir.x * t;
        py += dir.y * t;
      } else if (!dead && i > 0) {
        const prev = snake[i - 1];
        px += (prev.x - s.x) * t * 0.9;
        py += (prev.y - s.y) * t * 0.9;
      }
      const shade = 1 - (i / Math.max(len, 8)) * 0.55;
      const grow = eatPulse > 0 ? 1 + eatPulse * 0.12 : 1;
      const pad = cell * (0.08 + (1 - shade) * 0.06);
      const r = cell * 0.32;
      ctx.save();
      if (i === 0) { ctx.shadowColor = dead ? "#f87171" : "#34d399"; ctx.shadowBlur = 14; }
      ctx.fillStyle = dead
        ? `rgba(120,130,150,${0.5 + shade * 0.4})`
        : `rgba(${Math.round(16 + 36 * (1 - shade))}, ${Math.round(185 * shade)}, ${Math.round(129 * shade)}, 1)`;
      const sz = (cell - pad * 2) * grow;
      const off = (cell - sz) / 2;
      roundRect(px * cell + off, py * cell + off, sz, sz, r);
      ctx.fill();
      ctx.restore();

      // olhos da cabeça
      if (i === 0) {
        const ex = (px + 0.5) * cell, ey = (py + 0.5) * cell;
        const ox = dir.x, oy = dir.y;
        const perpX = -oy, perpY = ox;
        ctx.fillStyle = "#0b1120";
        for (const sgn of [-1, 1]) {
          ctx.beginPath();
          ctx.arc(
            ex + (ox * 0.18 + perpX * 0.2 * sgn) * cell,
            ey + (oy * 0.18 + perpY * 0.2 * sgn) * cell,
            cell * 0.09, 0, Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    if (eatPulse > 0) eatPulse = Math.max(0, eatPulse - 0.08);
  }

  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }

  // ---------- Loop principal ----------
  function loop(now) {
    try {
      if (state === "playing") {
        // limita passos por quadro para não travar a aba após ficar em segundo plano
        let guard = 5;
        while (now - lastTick >= speedMs && guard > 0) {
          lastTick += speedMs;
          guard--;
          step(now);
          if (state !== "playing") break;
        }
        if (guard <= 0 && now - lastTick >= speedMs) lastTick = now;
      }
      draw(now);
    } catch (err) {
      console.error("Erro no loop do jogo:", err); // nunca deixa o rAF morrer
    }
    requestAnimationFrame(loop);
  }

  // ---------- Inicialização ----------
  function init() {
    highscore = loadHighscore();
    highEl.textContent = highscore;
    setSpeed(parseInt(localStorage.getItem(SPEED_KEY) || "95", 10) || 95, false);
    cell = canvas.clientWidth / GRID; // valor inicial mesmo antes do layout final
    resize();
    resetGame(false);
    requestAnimationFrame(loop);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
