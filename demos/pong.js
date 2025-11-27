(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width; const HEIGHT = canvas.height;

  const PADDLE_W = 10, PADDLE_H = 120, BALL = 16;
  const BASE_SPEED = 7;
  let difficulty = 'Nightmare';

  const DIFFICULTIES = {
    
    Easy: { paddleSpeed: 3, reaction: 0.6, error: 120, ballMult: 0.7 },
    Medium: { paddleSpeed: 7, reaction: 0.2, error: 30, ballMult: 0.95 },
    Hard: { paddleSpeed: 12, reaction: 0.08, error: 8, ballMult: 1.05 },
    Nightmare: { paddleSpeed: 20, reaction: 0.0, error: 0, ballMult: 1.18 }
  };

  const left = { x: 40, y: (HEIGHT - PADDLE_H) / 2, w: PADDLE_W, h: PADDLE_H };
  const right = { x: WIDTH - 40 - PADDLE_W, y: (HEIGHT - PADDLE_H) / 2, w: PADDLE_W, h: PADDLE_H };
  const ball = { x: (WIDTH - BALL) / 2, y: (HEIGHT - BALL) / 2, vx: BASE_SPEED, vy: BASE_SPEED };
  let scoreL = 0, scoreR = 0; const WIN = 7;
  let paused = false;
  let lastLeftReact = 0, lastRightReact = 0; let leftTarget = HEIGHT/2, rightTarget = HEIGHT/2;

  function resetBall(dir = 1) {
    ball.x = (WIDTH - BALL) / 2; ball.y = (HEIGHT - BALL) / 2;
    const base = BASE_SPEED * DIFFICULTIES[difficulty].ballMult;
    ball.vx = base * dir; ball.vy = (Math.random() < 0.5 ? 1 : -1) * base;
  }

  function draw() {
    ctx.fillStyle = '#07090b'; ctx.fillRect(0,0,WIDTH,HEIGHT);
    
    ctx.fillStyle = '#eaeff6'; ctx.fillRect(left.x, left.y, left.w, left.h);
    ctx.fillRect(right.x, right.y, right.w, right.h);
    
    ctx.beginPath(); ctx.fillStyle = '#eaeff6'; ctx.ellipse(ball.x+BALL/2, ball.y+BALL/2, BALL/2, BALL/2, 0, 0, Math.PI*2); ctx.fill();
    
    ctx.strokeStyle = '#6f7784'; ctx.beginPath(); ctx.moveTo(WIDTH/2,0); ctx.lineTo(WIDTH/2,HEIGHT); ctx.stroke();
    
    ctx.fillStyle = '#eaeff6'; ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${scoreL} — ${scoreR}`, WIDTH/2, 36);
    
    ctx.font = '14px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#9aa3b2'; ctx.fillText(`Difficulty: ${difficulty}`, 12, HEIGHT - 12);
  }

  
  function predictY(x, y, vx, vy, targetX) {
    let px = x, py = y, pvx = vx, pvy = vy;
    for (let i=0;i<5000;i++){
      px += pvx; py += pvy;
      if (py <= 0){ py = -py; pvy = -pvy; }
      if (py + BALL >= HEIGHT){ py = 2*(HEIGHT - BALL) - py; pvy = -pvy; }
      if (pvx < 0 && px <= targetX) return py + BALL/2;
      if (pvx > 0 && px + BALL >= targetX) return py + BALL/2;
    }
    return HEIGHT/2;
  }

  function aiUpdate(dt) {
    const params = DIFFICULTIES[difficulty];
    const now = performance.now();
    // If we're in Nightmare mode, make the bots near-perfect: instant position to predicted intercept
    if (difficulty === 'Nightmare') {
      // Predict for left and right and snap paddle centers to the intercept point
      const pl = predictY(ball.x, ball.y, ball.vx, ball.vy, left.x + left.w + 1);
      const pr = predictY(ball.x, ball.y, ball.vx, ball.vy, right.x - BALL - 1);
      left.y = Math.max(0, Math.min(HEIGHT - left.h, pl - left.h/2));
      right.y = Math.max(0, Math.min(HEIGHT - right.h, pr - right.h/2));
      return;
    }

    if (now - lastLeftReact > params.reaction*1000) {
      const targ = predictY(ball.x, ball.y, ball.vx, ball.vy, left.x + left.w + 1);
      leftTarget = targ + (Math.random()*2-1)*params.error;
      lastLeftReact = now;
    }
    
    if (now - lastRightReact > params.reaction*1000) {
      const targ = predictY(ball.x, ball.y, ball.vx, ball.vy, right.x - BALL - 1);
      rightTarget = targ + (Math.random()*2-1)*params.error;
      lastRightReact = now;
    }

    
    const ls = params.paddleSpeed, rs = params.paddleSpeed;
    if (left.y + left.h/2 < leftTarget - 6) left.y += ls; else if (left.y + left.h/2 > leftTarget + 6) left.y -= ls;
    if (right.y + right.h/2 < rightTarget - 6) right.y += rs; else if (right.y + right.h/2 > rightTarget + 6) right.y -= rs;

    
    left.y = Math.max(0, Math.min(HEIGHT - left.h, left.y));
    right.y = Math.max(0, Math.min(HEIGHT - right.h, right.y));
  }

  function step() {
    if (!paused && scoreL < WIN && scoreR < WIN) {
      ball.x += ball.vx; ball.y += ball.vy;
      
      if (ball.y <= 0 || ball.y + BALL >= HEIGHT) ball.vy = -ball.vy;
      
      if (ball.x <= left.x + left.w && ball.x + BALL >= left.x && ball.y + BALL >= left.y && ball.y <= left.y + left.h) {
        ball.vx = Math.abs(ball.vx) * 1.03; const offset = ((ball.y + BALL/2) - (left.y + left.h/2)) / (left.h/2); ball.vy = Math.max(-25, Math.min(25, BASE_SPEED*offset));
      }
      if (ball.x + BALL >= right.x && ball.x <= right.x + right.w && ball.y + BALL >= right.y && ball.y <= right.y + right.h) {
        ball.vx = -Math.abs(ball.vx) * 1.03; const offset = ((ball.y + BALL/2) - (right.y + right.h/2)) / (right.h/2); ball.vy = Math.max(-25, Math.min(25, BASE_SPEED*offset));
      }

      if (ball.x <= 0) { scoreR++; resetBall(1); }
      if (ball.x + BALL >= WIDTH) { scoreL++; resetBall(-1); }

      aiUpdate(1/60);
    }
    draw();
    if (paused && scoreL < WIN && scoreR < WIN) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,WIDTH,HEIGHT);
      ctx.fillStyle = '#fff'; ctx.font = '64px sans-serif'; ctx.textAlign='center'; ctx.fillText('PAUSE', WIDTH/2, HEIGHT/2);
    }
    if (scoreL >= WIN || scoreR >= WIN) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,WIDTH,HEIGHT);
      ctx.fillStyle = '#ffda6b'; ctx.font = '44px sans-serif'; ctx.textAlign='center';
      const t = scoreL >= WIN ? 'Bot Gauche a gagné !' : 'Bot Droit a gagné !'; ctx.fillText(t, WIDTH/2, HEIGHT/2 - 10);
      ctx.font = '18px sans-serif'; ctx.fillStyle='#dfe6f2'; ctx.fillText('R: rejouer  —  ESC: retour', WIDTH/2, HEIGHT/2 + 26);
    }
    requestAnimationFrame(step);
  }

  
  window.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.code === 'Space') { paused = !paused; }
    if (e.key === 'r') { scoreL = 0; scoreR = 0; resetBall(1); }
    if (e.key === 'Escape') {
      
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'close-demo' }, '*');
      } else {
        window.history.back();
      }
    }
  });

  
  const settingsBtn = document.getElementById('settingsBtn');
  const modal = document.getElementById('settingsModal');
  const closeBtn = document.getElementById('closeSettings');
  const applyBtn = document.getElementById('applySettings');
  settingsBtn.addEventListener('click', () => { modal.setAttribute('aria-hidden','false'); });
  closeBtn.addEventListener('click', () => { modal.setAttribute('aria-hidden','true'); });
  applyBtn.addEventListener('click', () => {
    const val = document.querySelector('input[name="difficulty"]:checked').value;
    difficulty = val; leftTarget = HEIGHT/2; rightTarget = HEIGHT/2; lastLeftReact = 0; lastRightReact = 0;
    resetBall(1); modal.setAttribute('aria-hidden','true');
  });

  
  document.querySelectorAll('input[name="difficulty"]').forEach(r => {
    r.addEventListener('change', (ev) => {
      difficulty = ev.target.value;
      leftTarget = HEIGHT/2; rightTarget = HEIGHT/2; lastLeftReact = 0; lastRightReact = 0;
      resetBall(1);
    });
  });

  document.getElementById('restartBtn').addEventListener('click', () => { scoreL=0; scoreR=0; resetBall(1); });
  document.getElementById('backBtn').addEventListener('click', () => {
    
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'close-demo' }, '*');
    } else {
      window.history.back();
    }
  });

  
  (function initUI(){ const radios = document.querySelectorAll('input[name="difficulty"]'); radios.forEach(r => { if (r.value===difficulty) r.checked=true }); })();

  resetBall(1);
  requestAnimationFrame(step);
})();
