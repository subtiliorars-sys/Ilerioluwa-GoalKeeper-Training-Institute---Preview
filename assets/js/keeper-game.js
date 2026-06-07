// ============================================================
// GUARDIAN OF GOAL — penalty-save mini-game.
// 100% original code & art (canvas shapes only) — owned by the
// Center, no third-party assets, nothing to license.
// Tap/click LEFT, MIDDLE or RIGHT (or arrow keys) to dive.
// ============================================================
(function () {
  var cvs = document.getElementById('gog');
  if (!cvs || !cvs.getContext) return;
  var ctx = cvs.getContext('2d');

  // Logical canvas size; rendered at devicePixelRatio for crispness.
  var W = 420, H = 480;
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  cvs.width = W * DPR; cvs.height = H * DPR;
  ctx.scale(DPR, DPR);

  var VOLT = '#c8f31d', TEAL = '#5eead4', PAPER = '#f4f5f0', MUTED = '#9aa093';
  var GOAL = { l: 55, r: 365, bar: 80, line: 264 };       // posts/crossbar/goal-line
  var ZONE_X = [108, 210, 312];                           // dive/shot targets L/M/R
  var TARGET_Y = 178;                                     // ball height at goal
  var SPOT = { x: 210, y: 428 };                          // penalty spot
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var best = 0;
  try { best = +(localStorage.getItem('gog-best') || 0); } catch (e) {}

  // ---- state ----
  var st = 'idle';          // idle | ready | flight | saved | over
  var streak = 0;
  var ballZone = 1, pick = -1, pickAt = 0;
  var kickAt = 0, dur = 900, savedUntil = 0, resolvedAt = 0, deflectDir = 1;
  var now = 0, raf = 0;

  var startUI = document.getElementById('gog-start');
  var overUI = document.getElementById('gog-over');
  var overText = document.getElementById('gog-over-text');
  var shareBtn = document.getElementById('gog-share');

  // ---- tiny synth sfx (no audio files) ----
  var AC = null;
  function audioInit() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
  }
  function sfx(kind) {
    if (!AC) return;
    try {
      var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
      o.connect(g); g.connect(AC.destination);
      if (kind === 'kick') {
        o.type = 'triangle'; o.frequency.setValueAtTime(120, t);
        g.gain.setValueAtTime(.15, t); g.gain.exponentialRampToValueAtTime(.001, t + .12);
        o.start(t); o.stop(t + .13);
      } else if (kind === 'save') {
        o.type = 'square'; o.frequency.setValueAtTime(660, t); o.frequency.setValueAtTime(880, t + .07);
        g.gain.setValueAtTime(.09, t); g.gain.exponentialRampToValueAtTime(.001, t + .18);
        o.start(t); o.stop(t + .2);
      } else { // goal conceded
        o.type = 'sawtooth'; o.frequency.setValueAtTime(320, t);
        o.frequency.exponentialRampToValueAtTime(110, t + .35);
        g.gain.setValueAtTime(.09, t); g.gain.exponentialRampToValueAtTime(.001, t + .4);
        o.start(t); o.stop(t + .42);
      }
    } catch (e) {}
  }

  // ---- helpers ----
  function lerp(a, b, p) { return a + (b - a) * p; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 2); }
  function clamp01(p) { return p < 0 ? 0 : p > 1 ? 1 : p; }

  // ---- drawing ----
  function drawPitch() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#10130d'); g.addColorStop(.55, '#161a11'); g.addColorStop(1, '#0b0c0a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // mowing stripes
    ctx.fillStyle = 'rgba(200,243,29,0.03)';
    for (var i = 0; i < 5; i += 2) ctx.fillRect(0, GOAL.line + i * 36, W, 36);
    // penalty box hint
    ctx.strokeStyle = 'rgba(244,245,240,0.18)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, GOAL.line + 86); ctx.lineTo(60, GOAL.line + 8);
    ctx.moveTo(W - 18, GOAL.line + 86); ctx.lineTo(W - 60, GOAL.line + 8);
    ctx.stroke();
    // penalty spot
    ctx.fillStyle = 'rgba(244,245,240,0.5)';
    ctx.beginPath(); ctx.arc(SPOT.x, SPOT.y, 3, 0, 7); ctx.fill();
  }

  function drawGoal() {
    // net
    ctx.strokeStyle = 'rgba(244,245,240,0.14)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = GOAL.l; x <= GOAL.r; x += 16) { ctx.moveTo(x, GOAL.bar); ctx.lineTo(x, GOAL.line); }
    for (var y = GOAL.bar; y <= GOAL.line; y += 16) { ctx.moveTo(GOAL.l, y); ctx.lineTo(GOAL.r, y); }
    ctx.stroke();
    // frame
    ctx.strokeStyle = PAPER; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(GOAL.l, GOAL.line); ctx.lineTo(GOAL.l, GOAL.bar);
    ctx.lineTo(GOAL.r, GOAL.bar); ctx.lineTo(GOAL.r, GOAL.line);
    ctx.stroke();
    // goal line
    ctx.strokeStyle = 'rgba(244,245,240,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, GOAL.line); ctx.lineTo(W - 20, GOAL.line); ctx.stroke();
  }

  function drawKeeper() {
    // dive offset/lean toward picked zone
    var x = 210, lean = 0, reach = 0;
    if (pick >= 0) {
      var q = easeOut(clamp01((now - pickAt) / 170));
      x = lerp(210, ZONE_X[pick], q);
      lean = (pick - 1) * 0.55 * q;
      reach = q;
    }
    ctx.save();
    ctx.translate(x, GOAL.line - 6);
    ctx.rotate(lean);
    // legs
    ctx.strokeStyle = '#0b0c0a'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-7, -18); ctx.lineTo(-11, 0); ctx.moveTo(7, -18); ctx.lineTo(11, 0); ctx.stroke();
    // body — black jersey
    ctx.fillStyle = '#101210';
    ctx.strokeStyle = TEAL; ctx.lineWidth = 1.5;
    rounded(-14, -62, 28, 46, 8); ctx.fill(); ctx.stroke();
    // varsity 77
    ctx.fillStyle = PAPER; ctx.font = '900 13px system-ui,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('77', 0, -32);
    // arms + volt gloves
    var armY = -52, gx = 22 + reach * 16, gy = armY - reach * 22;
    ctx.strokeStyle = '#101210'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(-10, armY); ctx.lineTo(-gx, gy); ctx.moveTo(10, armY); ctx.lineTo(gx, gy); ctx.stroke();
    ctx.fillStyle = VOLT;
    ctx.beginPath(); ctx.arc(-gx, gy, 7, 0, 7); ctx.arc(gx, gy, 7, 0, 7); ctx.fill();
    // head
    ctx.fillStyle = '#c9a07e';
    ctx.beginPath(); ctx.arc(0, -72, 10, 0, 7); ctx.fill();
    ctx.restore();
  }

  function rounded(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawStriker(p) { // p: 0 far → 1 at ball
    var x = lerp(SPOT.x - 64, SPOT.x - 20, easeOut(p)), y = SPOT.y - 4;
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#23261f'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(-6, 4); ctx.moveTo(0, -16); ctx.lineTo(8, 2); ctx.stroke();
    ctx.fillStyle = '#2e3328'; rounded(-8, -44, 16, 30, 6); ctx.fill();
    ctx.fillStyle = '#a3795c'; ctx.beginPath(); ctx.arc(0, -52, 8, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawBall(x, y, r) {
    ctx.fillStyle = PAPER;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#0b0c0a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * .35, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r, y, r * .9, -0.6, 0.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r, y, r * .9, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
  }

  function drawHud() {
    ctx.textAlign = 'left'; ctx.fillStyle = VOLT;
    ctx.font = '900 15px system-ui,sans-serif';
    ctx.fillText('SAVES ' + streak, 14, 26);
    ctx.textAlign = 'right'; ctx.fillStyle = MUTED;
    ctx.fillText('BEST ' + best, W - 14, 26);
  }

  function drawZoneHints() {
    ctx.fillStyle = 'rgba(200,243,29,0.5)';
    ctx.font = '900 12px system-ui,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('◀ LEFT', 70, H - 16);
    ctx.fillText('▲ MIDDLE', 210, H - 16);
    ctx.fillText('RIGHT ▶', 350, H - 16);
  }

  function flash(text, color) {
    ctx.fillStyle = color;
    ctx.font = '900 44px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, 150);
  }

  // ---- ball flight path ----
  function ballPos(p) {
    var e = easeOut(p);
    return {
      x: lerp(SPOT.x, ZONE_X[ballZone], e),
      y: lerp(SPOT.y, TARGET_Y, e) - Math.sin(p * Math.PI) * 26,
      r: lerp(13, 8, e)
    };
  }

  // ---- game flow ----
  function startGame() {
    audioInit();
    streak = 0;
    startUI.hidden = true; overUI.hidden = true;
    nextRound();
  }

  function nextRound() {
    ballZone = Math.floor(Math.random() * 3);
    pick = -1;
    dur = Math.max(440, 900 - streak * 45);          // faster every save
    kickAt = performance.now() + 520 + Math.random() * 620;
    st = 'ready';
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function resolve() {
    if (pick === ballZone) {
      streak++;
      if (streak > best) { best = streak; try { localStorage.setItem('gog-best', '' + best); } catch (e) {} }
      st = 'saved'; savedUntil = now + 750; resolvedAt = now;
      deflectDir = ballZone === 1 ? (Math.random() < .5 ? -1 : 1) : (ballZone - 1);
      sfx('save');
    } else {
      st = 'over'; resolvedAt = now;
      sfx('goal');
      setTimeout(showOver, 700);
    }
  }

  function showOver() {
    overText.innerHTML = streak === 0
      ? 'No saves this time — the shooter got you early.'
      : '<span class="gog-big">' + streak + '</span> save' + (streak === 1 ? '' : 's') +
        ' in a row' + (streak === best ? ' — NEW BEST! 🧤' : ' · best ' + best);
    var msg = '🧤 I made ' + streak + ' save' + (streak === 1 ? '' : 's') +
      ' in a row on the Guardian of Goal game! Think you can beat me? ' +
      'Play it on the Ilerioluwa Goalkeeper Training Center site: ' +
      location.origin + location.pathname + '#game';
    shareBtn.href = 'https://wa.me/?text=' + encodeURIComponent(msg);
    overUI.hidden = false;
  }

  // ---- main loop (runs only while playing) ----
  function loop(ts) {
    now = ts;
    raf = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);
    drawPitch(); drawGoal();

    if (st === 'ready') {
      var rp = clamp01(1 - (kickAt - now) / 600);
      drawKeeper(); drawStriker(rp); drawBall(SPOT.x, SPOT.y, 13); drawZoneHints();
      if (now >= kickAt) { st = 'flight'; sfx('kick'); }
    } else if (st === 'flight') {
      var p = clamp01((now - kickAt) / dur);
      var b = ballPos(p);
      drawKeeper(); drawStriker(1); drawBall(b.x, b.y, b.r); drawZoneHints();
      if (p >= 1) resolve();
    } else if (st === 'saved') {
      // ball parried away from the glove
      var q = clamp01((now - resolvedAt) / 400);
      drawKeeper(); drawStriker(1);
      ctx.globalAlpha = 1 - q * .7;
      drawBall(ZONE_X[ballZone] + deflectDir * 90 * q, TARGET_Y - 60 * q + 80 * q * q, 8);
      ctx.globalAlpha = 1;
      if (!reduced) flash('SAVED!', VOLT);
      if (now >= savedUntil) nextRound();
    } else if (st === 'over') {
      var b2 = ballPos(1);
      // a conceded middle ball must not paint on the standing keeper's head —
      // he never jumped, so show it sailing OVER him, high in the net
      var by = (ballZone === 1 && pick < 0) ? TARGET_Y - 64 : b2.y + 10;
      drawKeeper(); drawStriker(1); drawBall(b2.x, by, 8);
      flash('GOAL…', TEAL);
      cancelAnimationFrame(raf); raf = 0;
    }
    drawHud();
  }

  // ---- input ----
  function pickZone(z) {
    if ((st === 'ready' || st === 'flight') && pick < 0) { pick = z; pickAt = performance.now(); }
  }
  cvs.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    var rect = cvs.getBoundingClientRect();
    var x = (e.clientX - rect.left) * (W / rect.width);
    pickZone(x < W / 3 ? 0 : x < 2 * W / 3 ? 1 : 2);
  });
  document.addEventListener('keydown', function (e) {
    if (st !== 'ready' && st !== 'flight') return;
    if (e.key === 'ArrowLeft') pickZone(0);
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') pickZone(1); // hint shows ▲ — accept both
    else if (e.key === 'ArrowRight') pickZone(2);
  });
  // on-screen pads — the visible controls on mobile (clickable on desktop too)
  Array.prototype.forEach.call(document.querySelectorAll('.gog-pad'), function (b) {
    b.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      pickZone(+b.getAttribute('data-zone'));
    });
  });
  document.getElementById('gog-play').addEventListener('click', startGame);
  document.getElementById('gog-again').addEventListener('click', startGame);

  // ---- full screen (native API, .gog-max CSS fallback where unsupported e.g. iOS) ----
  var frame = cvs.parentElement;
  var fsBtn = document.getElementById('gog-fs');
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function fsActive() { return fsEl() === frame || frame.classList.contains('gog-max'); }
  function fsGlyph() { fsBtn.textContent = fsActive() ? '✕' : '⛶'; fsBtn.title = fsActive() ? 'Exit full screen' : 'Full screen'; }
  if (fsBtn) {
    fsBtn.addEventListener('click', function () {
      if (fsEl() === frame) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        return;
      }
      if (frame.classList.contains('gog-max')) { frame.classList.remove('gog-max'); fsGlyph(); return; }
      if (frame.requestFullscreen) {
        frame.requestFullscreen().catch(function () { frame.classList.add('gog-max'); fsGlyph(); });
      } else if (frame.webkitRequestFullscreen) { // older Safari
        try { frame.webkitRequestFullscreen(); } catch (e) { frame.classList.add('gog-max'); fsGlyph(); }
      } else { frame.classList.add('gog-max'); fsGlyph(); }
    });
    document.addEventListener('fullscreenchange', fsGlyph);
    document.addEventListener('webkitfullscreenchange', fsGlyph);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && frame.classList.contains('gog-max')) { frame.classList.remove('gog-max'); fsGlyph(); }
    });
  }

  // static first frame behind the start overlay
  drawPitch(); drawGoal(); drawKeeper(); drawBall(SPOT.x, SPOT.y, 13); drawHud();
})();
