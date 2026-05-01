
    // ── NAV ──
    const mainNav = document.getElementById('main-nav');
    const burger = document.getElementById('nav-burger');
    const drawer = document.getElementById('nav-drawer');

    window.addEventListener('scroll', () => {
      mainNav.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });

    // Disable nav backdrop-filter while the hero section is in view.
    // Firefox renders backdrop-filter in software — moving elements behind
    // it (CSS animations, canvas) trigger a full CPU blur every frame.
    // The class is removed once the user scrolls past the hero; from that
    // point the blur looks fine over static page content.
    mainNav.classList.add('over-hero'); // hero is always visible on load
    new IntersectionObserver(([entry]) => {
      mainNav.classList.toggle('over-hero', entry.isIntersecting);
    }, { threshold: 0 }).observe(document.getElementById('hero'));

    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      drawer.classList.toggle('open');
    });
    document.querySelectorAll('.drawer-link, .drawer-cta').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        drawer.classList.remove('open');
      });
    });

    // ═══════════════════════════════════════
    // SHOP MY SKILLS — GAME ENGINE
    // ═══════════════════════════════════════
    (function () {

      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d', { alpha: false }); // opaque = no alpha compositing overhead
      let DPR = Math.min(window.devicePixelRatio || 1, 2); // max 2× voor geheugen
      const startEl = document.getElementById('game-start');
      const startBtn = document.getElementById('start-btn');
      const fsCloseBtn = document.getElementById('fs-close-btn');
      const popupEl = document.getElementById('skill-popup');
      const tipEl = document.getElementById('jump-tip');
      const endEl = document.getElementById('game-end');
      const heroEl = document.getElementById('hero');
      const replayBtn = document.getElementById('replay-btn');
      const scrollCta = document.getElementById('scroll-cta');
      const navEl = document.querySelector('nav');

      // ── ASSETS ──
      const bgImg = new Image(); bgImg.src = '../images/bg.jpg';
      const autoBgImg = new Image(); autoBgImg.src = '../game/auto_bg.png';
      const wielLinksImg = new Image(); wielLinksImg.src = '../game/wiel_links.png';
      const wielRechtsImg = new Image(); wielRechtsImg.src = '../game/wiel_rechts.png';
      const hoofdImg = new Image(); hoofdImg.src = '../game/hoofd.png';
      // ── SKILL ICONS ──
      const iconAardbeien = new Image(); iconAardbeien.src = '../products/aardbeien.png';
      const iconBorrelplank = new Image(); iconBorrelplank.src = '../products/borrelplank.png';
      const iconCupasoup = new Image(); iconCupasoup.src = '../products/cupasoup.png';
      const iconSalades = new Image(); iconSalades.src = '../products/salades.png';
      const iconSapjes = new Image(); iconSapjes.src = '../products/sapjes.png';
      const iconSoep = new Image(); iconSoep.src = '../products/soep.png';
      const hudScoreImg = new Image(); hudScoreImg.src = '../game/UI_Score.svg';
      const hudTimerImg = new Image(); hudTimerImg.src = '../game/UI_Timer.svg';

      // ── GAME STATE ──
      let gameState = 'start'; // 'start' | 'intro' | 'playing' | 'outro' | 'end'
      let camX = 0, tick = 0, raf = null, lastTime = 0;
      let spawnTimer = 0;
      let cachedGradient = null, cachedGradH = 0; // cached fallback bg gradient
      let particles = [], popupTimer = null;
      let cartDrawX = 0;   // actual draw X (animated for intro/outro)
      let introTick = 0;
      let outroVX = 0;
      let wheelAngle = 0;        // cumulative wheel rotation (radians)
      let headAngle = 0;        // pendulum angle (radians)
      let headTick = 0;        // time counter for pendulum

      // ── PLAYER ──
      const player = { screenX: 0, y: 0, w: 0, h: 0 };

      // ── VASTE SPELRESOLUTIE ── alles wordt hierbinnen getekend, CSS transform schaalt de canvas
      const GAME_W = 1280;
      const GAME_H = 720;

      // ── GAME CONSTANTS ── (vaste pixels in 1280×720 ruimte)
      const AUTO_SPEED = 3.8;
      const GROUND_Y = GAME_H;
      const PLAYER_SPEED = 16;
      const FALL_SPEED = 11;
      const CATCH_RADIUS = 90;

      // ── KEYBOARD STATE ──
      const keys = {};
      window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'Escape' && gameState !== 'start') goToStart();
      });
      window.addEventListener('keyup', e => { keys[e.code] = false; });

      // ── COLLECTIBLES (producten die van boven vallen) ──
      const COLLECTIBLES = [
        {
          worldX: 700,
          name: 'After Effects', detail: 'Expert · 15+ jaar dagelijks gebruik',
          glowColor: '#9b59ff', iconBg: '#0c0020', iconImg: iconAardbeien
        },
        {
          worldX: 1420,
          name: 'Premiere Pro', detail: '15 jaar professionele video-editing',
          glowColor: '#5b8fff', iconBg: '#00102a', iconImg: iconBorrelplank
        },
        {
          worldX: 2100,
          name: 'Social Video', detail: 'Campagnes voor Škoda, L\'Oréal & meer',
          glowColor: '#c0c0c0', iconBg: '#1c1c1c', iconImg: iconCupasoup
        },
        {
          worldX: 2840,
          name: '15 Jaar Werkervaring', detail: 'Senior-level creative & motion expertise',
          glowColor: '#ffd700', iconBg: '#1a1200', iconImg: iconSoep
        },
        {
          worldX: 3540,
          name: 'Figma · UI Design', detail: 'Interface design & prototyping',
          glowColor: '#a259ff', iconBg: '#110020', iconImg: iconSalades
        },
        {
          worldX: 4220,
          name: 'HTML5 · Display Advertising', detail: 'Banner tooling & interactieve HTML-ads',
          glowColor: '#f07340', iconBg: '#1a0c00', iconImg: iconSapjes
        },
        {
          worldX: 4960,
          name: 'After Effects · Motion', detail: 'Motion graphics & complexe animaties',
          glowColor: '#9b59ff', iconBg: '#0c0020', iconImg: iconAardbeien
        },
        {
          worldX: 5720,
          name: 'Klaar voor Kruidvat Studio ⭐', detail: 'Senior Video Editor · Motion Designer',
          glowColor: '#295813', iconBg: '#0a2005', iconImg: iconCupasoup
        },
      ];
      function resetCollectibles() {
        COLLECTIBLES.forEach(c => {
          c.collected = false;
          c.active = false;   // wordt true wanneer het product begint te vallen
          c.fallY = -150;    // huidige Y positie tijdens vallen
          c.screenX = 0;       // vaste scherm X positie (willekeurig gekozen bij spawn)
          c.phase = Math.random() * Math.PI * 2;
        });
      }
      resetCollectibles();

      let collectedCount = 0;
      let gameTimer = 15;   // seconden aftellen
      const GAME_DURATION = 15;

      // ── RESIZE ──
      // Canvas-buffer alleen opnieuw alloceren als DPR daadwerkelijk verandert
      // (iOS Safari triggert visualViewport resize bij elke adresbalk-beweging)
      let _lastDPR = 0;
      function resize() {
        const newDPR = Math.min(window.devicePixelRatio || 1, 2);
        if (newDPR !== _lastDPR) {
          _lastDPR = DPR = newDPR;
          canvas.width = GAME_W * DPR;
          canvas.height = GAME_H * DPR;
          canvas.style.width = GAME_W + 'px';
          canvas.style.height = GAME_H + 'px';
        }

        // Gebruik visualViewport (betrouwbaar cross-browser, incl. Safari address bar)
        // met container als fallback
        const container = document.getElementById('game-container');
        const vv = window.visualViewport;
        const isGamePlaying = document.body.classList.contains('game-playing');
        const navOffset = isGamePlaying ? 0 : 60;
        const cw = (vv ? vv.width : null) || container.clientWidth || window.innerWidth;
        const ch = (vv ? vv.height - navOffset : null) || container.clientHeight || Math.max(200, window.innerHeight - navOffset);

        const scale = Math.max(0.1, Math.min(cw / GAME_W, ch / GAME_H));
        canvas.style.transform = `scale(${scale})`;

        // Speler altijd in 1280×720 coördinaten
        const aspect = (autoBgImg.complete && autoBgImg.naturalWidth > 0)
          ? autoBgImg.naturalWidth / autoBgImg.naturalHeight : 1.648;
        player.screenX = GAME_W * 0.35;
        player.h = GAME_H * 0.38;
        player.w = player.h * aspect;
        player.y = GROUND_Y - player.h;
      }
      resize();
      window.addEventListener('resize', resize);
      // Throttle visualViewport resize — iOS Safari vuurt dit continu af bij adresbalk-animatie
      if (window.visualViewport) {
        let _vvTimer = 0;
        window.visualViewport.addEventListener('resize', () => {
          clearTimeout(_vvTimer);
          _vvTimer = setTimeout(resize, 100);
        });
      }

      autoBgImg.addEventListener('load', resize);

      // ── MOBILE TOUCH BUTTONS ──
      const btnLeft = document.getElementById('btn-left');
      const btnRight = document.getElementById('btn-right');
      ['touchstart', 'mousedown'].forEach(ev => {
        btnLeft.addEventListener(ev, e => { e.preventDefault(); keys['ArrowLeft'] = true; }, { passive: false });
        btnRight.addEventListener(ev, e => { e.preventDefault(); keys['ArrowRight'] = true; }, { passive: false });
      });
      ['touchend', 'touchcancel', 'mouseup'].forEach(ev => {
        btnLeft.addEventListener(ev, e => { e.preventDefault(); keys['ArrowLeft'] = false; }, { passive: false });
        btnRight.addEventListener(ev, e => { e.preventDefault(); keys['ArrowRight'] = false; }, { passive: false });
      });

      // ── FULLSCREEN ──
      function enterFullscreen() {
        // Niet aanvragen als browser al fullscreen staat (voorkomt conflict/crash)
        if (document.fullscreenElement || document.webkitFullscreenElement) return;
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req) req.call(el).catch(() => { }); // catch: iOS Safari of geblokkeerd → gewoon doorgaan
      }
      function exitFullscreen() {
        const ex = document.exitFullscreen || document.webkitExitFullscreen;
        if (ex && (document.fullscreenElement || document.webkitFullscreenElement)) ex.call(document);
      }

      // Sluitknop: exit fullscreen + game stoppen
      fsCloseBtn.addEventListener('click', () => {
        exitFullscreen();
        goToStart();
      });

      // Verberg knop als fullscreen verlaten wordt (bijv. via Esc)
      document.addEventListener('fullscreenchange', onFsChange);
      document.addEventListener('webkitfullscreenchange', onFsChange);
      function onFsChange() {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
        fsCloseBtn.style.display = isFs ? 'flex' : 'none';
        // Dubbele rAF: wacht tot CSS (nav display:none / top:0) is toegepast vóór herberekening
        requestAnimationFrame(() => requestAnimationFrame(resize));
      }

      // ── TERUG NAAR START ──
      function goToStart() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        gameState = 'start';
        document.body.style.overflow = '';
        navEl.classList.remove('game-active');
        document.body.classList.remove('game-playing');
        tipEl.classList.remove('show');
        endEl.style.display = 'none';
        scrollCta.classList.remove('visible');
        startEl.style.display = 'flex';
        startEl.style.opacity = '0';
        requestAnimationFrame(() => { startEl.style.opacity = '1'; });
      }

      // ── START / REPLAY ──
      startBtn.addEventListener('click', startGame);
      replayBtn.addEventListener('click', replayGame);

      function startGame() {
        window.scrollTo({ top: 0, behavior: 'instant' }); // altijd naar boven voor fullscreen
        enterFullscreen(); // volledig scherm bij start

        gameState = 'intro';
        camX = 0; tick = 0; introTick = 0; outroVX = 0;
        collectedCount = 0; particles = [];
        gameTimer = GAME_DURATION; spawnTimer = 0;
        lastTime = 0;
        resetCollectibles();
        player.screenX = GAME_W * 0.35;
        player.y = GROUND_Y - player.h;
        cartDrawX = -player.w - 40; // schuift in van links

        // Disable nav backdrop-filter while canvas animates (major Safari perf gain)
        navEl.classList.add('game-active');
        document.body.classList.add('game-playing');
        requestAnimationFrame(() => requestAnimationFrame(resize)); // herbereken na nav-hide

        // Block scroll during game
        document.body.style.overflow = 'hidden';

        // Fade out start screen
        startEl.style.opacity = '0';
        setTimeout(() => { startEl.style.display = 'none'; }, 520);

        if (!raf) raf = requestAnimationFrame(loop);
      }

      function replayGame() {
        endEl.style.display = 'none';
        scrollCta.classList.remove('visible');
        heroEl.classList.remove('end-active');
        document.body.style.overflow = '';
        navEl.classList.remove('game-active');
        document.body.classList.remove('game-playing');
        gameState = 'start';
        camX = 0; tick = 0; collectedCount = 0; particles = [];
        lastTime = 0; gameTimer = GAME_DURATION; spawnTimer = 0;
        resetCollectibles();
        player.screenX = GAME_W * 0.35;
        startEl.style.display = 'flex';
        startEl.style.opacity = '0';
        startEl.style.transition = 'opacity .45s ease';
        requestAnimationFrame(() => { startEl.style.opacity = '1'; });
      }

      // ── POPUP ──
      function showPopup(c) {
        if (popupTimer) clearTimeout(popupTimer);
        popupEl.innerHTML = `
    <div class="popup-accent"></div>
    <div class="popup-body">
      <div class="popup-icon-wrap" style="background:${c.iconBg};padding:6px;border-radius:10px;">
        ${c.iconImg ? `<img src="${c.iconImg.src}" style="width:100%;height:100%;object-fit:contain;display:block;">` : '🎬'}
      </div>
      <div class="popup-texts">
        <div class="popup-name">${c.name}</div>
        <div class="popup-detail">${c.detail}</div>
      </div>
      <div class="popup-check">✓</div>
    </div>`;
        popupEl.classList.add('show');
        popupTimer = setTimeout(() => popupEl.classList.remove('show'), 2300);
      }

      // ── PARTICLES ──
      function spawnCollect(sx, sy, color) {
        for (let i = 0; i < 20; i++) {
          const a = (Math.PI * 2 * i) / 20;
          const s = 2.5 + Math.random() * 4.5;
          particles.push({
            x: sx, y: sy,
            vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1.5,
            r: 3 + Math.random() * 4, life: 1,
            decay: 0.025 + Math.random() * 0.015, color
          });
        }
      }
      function spawnMoveDust(dir) {
        const gY = GROUND_Y;
        for (let i = 0; i < 5; i++) {
          particles.push({
            x: player.screenX - dir * player.w * 0.3 + (Math.random() - .5) * 20,
            y: gY,
            vx: -dir * (1.5 + Math.random() * 2), vy: -Math.random() * 1.8,
            r: 2 + Math.random() * 2, life: 0.55, decay: 0.055,
            color: 'rgba(255,246,0,0.6)'
          });
        }
      }

      // ── DRAW: BACKGROUND ──
      function drawBg() {
        if (bgImg.complete && bgImg.naturalWidth > 0) {
          // Cover-scaling: altijd canvas volledig vullen ongeacht schermverhouding
          const scaleW = GAME_W / bgImg.naturalWidth;
          const scaleH = GAME_H / bgImg.naturalHeight;
          const scale = Math.max(scaleW, scaleH);
          const bw = bgImg.naturalWidth * scale;
          const bh = bgImg.naturalHeight * scale;
          // Verticaal centreren (crop gelijkmatig boven/onder)
          const by = (GAME_H - bh) / 2;
          const off = camX % bw;
          for (let x = -off; x < GAME_W + bw; x += bw) {
            ctx.drawImage(bgImg, x, by, bw, bh);
          }
        } else {
          // Cache gradient — recreating every frame is expensive in Safari
          if (!cachedGradient || cachedGradH !== GAME_H) {
            cachedGradH = GAME_H;
            cachedGradient = ctx.createLinearGradient(0, 0, 0, GAME_H);
            cachedGradient.addColorStop(0, '#1a0606');
            cachedGradient.addColorStop(1, '#0d0202');
          }
          ctx.fillStyle = cachedGradient;
          ctx.fillRect(0, 0, GAME_W, GAME_H);
        }
      }

      // ── DRAW: FLOOR ──
      function drawFloor() {
        const gy = GROUND_Y;
        // Subtle dark floor strip only
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(0, gy, GAME_W, GAME_H - gy);
      }


      // ── DRAW: COLLECTIBLE ICON (vallend product) ──
      function drawCollectible(c, sx, sy) {
        if (!c.iconImg || !c.iconImg.complete || c.iconImg.naturalWidth === 0) return;

        const wobble = Math.sin(tick * 0.07 + (c.phase || 0)) * 5;
        const drawX = sx + wobble;
        const imgW = 135;
        const imgH = imgW * (c.iconImg.naturalHeight / c.iconImg.naturalWidth);

        // Glow sterker als product dichter bij vangzone is én dichtbij speler staat
        const distY = Math.abs(sy - (GROUND_Y - player.h * 0.3));
        const nearY = Math.max(0, 1 - distY / (GAME_H * 0.45));
        const nearX = Math.max(0, 1 - Math.abs(sx - player.screenX) / 220);
        const glow = nearY * nearX;

        ctx.save();
        if (glow > 0.15) {
          ctx.shadowColor = c.glowColor;
          ctx.shadowBlur = 8 + glow * 18;
        }
        ctx.globalAlpha = 1;
        ctx.drawImage(c.iconImg, drawX - imgW / 2, sy - imgH / 2, imgW, imgH);
        ctx.restore();
      }

      function drawWheel(img, cx, cy, angle, dim) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, -dim / 2, -dim / 2, dim, dim);
        }
        ctx.restore();
      }

      // ── DRAW: KARRETJE ──
      function drawCart() {
        const gy = GROUND_Y;

        ctx.save();

        // Grondschaduw
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.beginPath();
        ctx.ellipse(cartDrawX, gy - 2, player.w * 0.44, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Anchor: bottom-center van de auto (op de grond)
        ctx.translate(cartDrawX, gy);

        const W = player.w;
        const H = player.h;

        // ── auto_bg pixel-analyse: 1134×688
        // Wiel posities als fractie van de image:
        //   achter wiel: ~15% van links, ~87% van top
        //   voor  wiel: ~62% van links, ~90% van top
        // In draw-coords (origin = bottom-center van rect -W/2..-W/2+W, -H..0):
        //   achter: x = -W/2 + W*0.15 = -W*0.35  |  y = -H + H*0.87 = -H*0.13
        //   voor:   x = -W/2 + W*0.62 =  W*0.12  |  y = -H + H*0.90 = -H*0.10
        const wheelDim = H * 0.115 * 2;

        // ── Laag 1: auto carrosserie ──
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.40)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        if (autoBgImg.complete && autoBgImg.naturalWidth > 0) {
          ctx.drawImage(autoBgImg, -W / 2, -H, W, H);
        } else {
          ctx.fillStyle = '#295813';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-W / 2, -H, W, H, 8);
          } else {
            ctx.rect(-W / 2, -H, W, H);
          }
          ctx.fill();
        }
        ctx.restore();

        // ── Laag 2: wielen (over carrosserie) ──
        drawWheel(wielLinksImg, -W * 0.27, -H * 0.13, wheelAngle, wheelDim);
        drawWheel(wielRechtsImg, W * 0.21, -H * 0.14, wheelAngle, wheelDim);

        // ── Laag 3: hoofd (bobblehead, anchor = kin) ──
        // Kin-positie in auto_bg:
        //   x ≈ 84% van links → draw x = -W/2 + W*0.84 = W*0.34
        //   y ≈ 47% van top   → draw y = -H + H*0.47  = -H*0.53
        if (hoofdImg.complete && hoofdImg.naturalWidth > 0) {
          const hW = W * 0.32;
          const hH = hW * (hoofdImg.naturalHeight / hoofdImg.naturalWidth);
          const chinX = W * 0.20;
          const chinY = -H * 0.48;

          ctx.save();
          ctx.translate(chinX, chinY);
          ctx.rotate(headAngle);
          ctx.shadowColor = 'rgba(0,0,0,0.28)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;
          // Teken omhoog vanaf kin (anchor = onderkant image)
          ctx.drawImage(hoofdImg, -hW / 2, -hH, hW, hH);
          ctx.restore();
        }

        ctx.restore();
      }

      // ── DRAW: PARTICLES ──
      function drawParticles(dt) {
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => {
          ctx.save();
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 0.18 * dt;
          p.life -= p.decay * dt;
        });
      }

      // ── DRAW: HUD (Score — UI_Score.svg) ──
      let _hudFontMain = '';
      function drawHUD() {
        // SVG pill: 294.8 × 118.6 native ratio — draw scaled to game height
        const pillH = Math.max(28, GAME_H * 0.065);
        const pillW = pillH * (294.8 / 118.6);
        const px = 14, py = 14;

        if (hudScoreImg.complete && hudScoreImg.naturalWidth > 0) {
          ctx.drawImage(hudScoreImg, px, py, pillW, pillH);
        }

        // Score getal rechts in de pill
        const fSize = pillH * 0.52;
        const fontMain = `bold ${fSize}px Kruidvat-ExtraBold, sans-serif`;
        if (_hudFontMain !== fontMain) { ctx.font = _hudFontMain = fontMain; }
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${collectedCount}`, px + pillW - pillH * 0.35, py + pillH * 0.5);
      }

      // ── DRAW: TIMER (UI_Timer.svg) ──
      let _timerFont = '';
      function drawProgress() {
        // Timer pill rechtsboven — zelfde formaat als score pill
        const pillH = Math.max(28, GAME_H * 0.065);
        const pillW = pillH * (294.8 / 118.6);
        const px = GAME_W - pillW - 14, py = 14;

        if (hudTimerImg.complete && hudTimerImg.naturalWidth > 0) {
          ctx.drawImage(hudTimerImg, px, py, pillW, pillH);
        }

        // Resterende seconden rechts in de pill
        const secs = Math.ceil(Math.max(0, gameTimer));
        const fSize = pillH * 0.52;
        const fontT = `bold ${fSize}px Kruidvat-ExtraBold, sans-serif`;
        if (_timerFont !== fontT) { ctx.font = _timerFont = fontT; }
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${secs}s`, px + pillW - pillH * 0.35, py + pillH * 0.5);
      }

      // ── DRAW: PIJL BOVEN VALLEND PRODUCT (wijzer voor speler) ──
      let _arrowFont = '';
      function drawNextArrow() {
        const arrowFont = `bold ${Math.max(18, GAME_H * 0.038)}px Kruidvat-ExtraBold, sans-serif`;
        if (_arrowFont !== arrowFont) { ctx.font = _arrowFont = arrowFont; }
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        COLLECTIBLES.forEach(c => {
          if (c.collected || !c.active) return;
          // Toon pijl alleen als product nog boven het zichtbare gedeelte is
          if (c.fallY > GAME_H * 0.25) return;
          const osc = 0.35 + Math.abs(Math.sin(tick * 0.09)) * 0.55;
          const ay = Math.max(28, c.fallY - 35); // pijl net boven het product
          ctx.fillStyle = `rgba(255,255,255,${osc})`;
          ctx.fillText('↓', c.screenX, ay);
        });
      }

      // ── UPDATE — dt-gebaseerd voor frame-rate onafhankelijkheid ──
      function update(dt) {
        // Timer aftellen (alleen tijdens playing)
        if (gameState === 'playing') {
          gameTimer -= dt / 60;
          if (gameTimer <= 0) { gameTimer = 0; setTimeout(triggerOutro, 200); }
        }

        // Achtergrond scroll (creëert gangpad-illusie)
        camX += AUTO_SPEED * dt;

        // ── Speler horizontale beweging ──
        let moveDir = 0;
        if (keys['ArrowLeft'] || keys['KeyA']) moveDir = -1;
        if (keys['ArrowRight'] || keys['KeyD']) moveDir = 1;

        // Wielen draaien altijd mee met de achtergrondscroll (auto rijdt altijd)
        wheelAngle += (AUTO_SPEED * dt) / (player.h * 0.14);

        if (moveDir !== 0) {
          player.screenX += moveDir * PLAYER_SPEED * dt;
          const margin = player.w * 0.45;
          player.screenX = Math.max(margin, Math.min(GAME_W - margin, player.screenX));
          if (Math.floor(tick) % 8 === 0) spawnMoveDust(moveDir);
          // Extra wiel-rotatie bij pijltoetsen (bovenop de basisrotatie)
          wheelAngle += moveDir * (PLAYER_SPEED * dt) / (player.h * 0.14);
        }
        // Head pendulum: continuous loop, gentle 8° swing
        headTick += dt * 0.035;
        headAngle = Math.sin(headTick) * 0.14;

        // ── Spawn-timer: gooi continu producten omlaag (chaos-modus) ──
        if (gameState === 'playing') {
          spawnTimer -= dt;
          if (spawnTimer <= 0) {
            const inactive = COLLECTIBLES.filter(c => !c.active);
            if (inactive.length > 0) {
              // Activeer 1 random inactief product
              const c = inactive[Math.floor(Math.random() * inactive.length)];
              c.active = true;
              c.fallY = -(80 + Math.random() * 250); // gestaggerd zodat ze niet gelijk aankomen
              c.screenX = GAME_W * 0.08 + Math.random() * GAME_W * 0.84;
            }
            // Interval: 8-18 frames → ~2-4 producten tegelijk op scherm
            spawnTimer = 8 + Math.random() * 10;
          }
        }

        // ── Vallende producten ──
        const gy = GROUND_Y;
        const catchZoneY = gy - player.h * 0.88;

        COLLECTIBLES.forEach(c => {
          if (!c.active) return;

          c.fallY += FALL_SPEED * dt;

          if (c.fallY >= catchZoneY) {
            if (Math.abs(c.screenX - player.screenX) < CATCH_RADIUS) {
              // Gevangen
              collectedCount++;
              spawnCollect(c.screenX, catchZoneY, c.glowColor);
              c.active = false;
              c.fallY = -150;
              return;
            }
          }

          // Gemist: product voorbij onderkant → deactiveer direct
          if (c.fallY > catchZoneY + 120) {
            c.active = false;
            c.fallY = -150;
          }
        });
      }

      // ── OUTRO: cart drives off to the right, then show end ──
      function triggerOutro() {
        if (gameState === 'outro' || gameState === 'end') return;
        gameState = 'outro';
        outroVX = 4;   // beginsnelheid naar rechts
        cartDrawX = player.screenX;
        player.y = GROUND_Y - player.h;
        tipEl.classList.remove('show');
      }

      function showEndScreen() {
        gameState = 'end';
        // Verlaat fullscreen zodat eindscherm in de normale pagina zichtbaar is
        exitFullscreen();
        // Vul het dynamische scorenummer in
        const scoreNumEl = document.getElementById('ge-score-num');
        if (scoreNumEl) scoreNumEl.textContent = collectedCount;
        endEl.style.display = 'block';
        scrollCta.classList.add('visible');
        navEl.classList.remove('game-active');
        document.body.classList.remove('game-playing');
        heroEl.classList.add('end-active');
        setTimeout(() => { document.body.style.overflow = ''; }, 400);
        updateEndLayout(); // positioneer Nico + score op basis van actueel viewport
      }

      // ── MAIN LOOP — delta-time based so speed is identical at any frame rate ──
      function loop(now) {
        if (gameState === 'end') { raf = null; return; }
        // Don't reschedule during start state — no canvas work needed and
        // keeping rAF alive at 60 fps competes with the CSS animation budget.
        // startGame() restarts the loop when the player hits Start.
        if (gameState === 'start') { raf = null; return; }
        raf = requestAnimationFrame(loop);

        if (document.hidden) { lastTime = now; return; }

        // dt = 1.0 at 60 fps, 2.0 at 30 fps, etc. Capped at 3 to avoid huge jumps after tab switch
        const dt = lastTime ? Math.min((now - lastTime) / (1000 / 60), 3) : 1;
        lastTime = now;
        tick += dt;

        // DPR-schaal toepassen zodat alle drawing-code GAME_W×GAME_H coördinaten gebruikt
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        // Hard-reset canvas state each frame — prevents shadow/alpha leaking between draw calls
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // ── INTRO: cart slides in from left ──
        if (gameState === 'intro') {
          introTick += dt;
          cartDrawX += (player.screenX - cartDrawX) * Math.min(0.055 * dt, 0.9);
          if (introTick > 90 || Math.abs(cartDrawX - player.screenX) < 2) {
            cartDrawX = player.screenX;
            gameState = 'playing';
            tipEl.classList.add('show', 'jump-tip--intro');
            setTimeout(() => {
              tipEl.style.opacity = '0';
              setTimeout(() => {
                tipEl.classList.remove('jump-tip--intro');
                tipEl.style.opacity = '';
              }, 420);
            }, 2600);
          }
          drawBg();
          drawFloor();
          drawCart();
          return;
        }

        // ── OUTRO: cart drives off to the right ──
        if (gameState === 'outro') {
          outroVX = Math.min(outroVX + 0.35 * dt, 28); // versnelt naar rechts
          cartDrawX += outroVX * dt;
          // wielen blijven draaien mee
          wheelAngle += (outroVX * dt) / (player.h * 0.14);
          drawBg();
          drawFloor();
          drawCart();
          drawParticles(dt);
          if (cartDrawX > GAME_W + player.w) {
            showEndScreen();
          }
          return;
        }

        // ── PLAYING ──
        cartDrawX = player.screenX;
        update(dt);
        drawBg();
        drawFloor();

        // Teken vallende producten
        COLLECTIBLES.forEach(c => {
          if (c.collected || !c.active) return;
          drawCollectible(c, c.screenX, c.fallY);
        });

        drawCart();
        drawParticles(dt);
        drawHUD();
        drawProgress();
        drawNextArrow();
      }

      // ── BLOCK PAGE SCROLL WHILE PLAYING ──
      window.addEventListener('keydown', e => {
        if (e.code === 'Space' && gameState === 'playing') e.preventDefault();
      }, { passive: false });

      // Pause/resume loop when tab visibility changes (saves CPU when tab is hidden)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && gameState !== 'end' && gameState !== 'start' && !raf) {
          raf = requestAnimationFrame(loop);
        }
      });

      // Start render loop (idle — canvas stays dark until game starts)
      raf = requestAnimationFrame(loop);

    })(); // end IIFE


    // ── REVEAL ──
    const revEls = document.querySelectorAll('.reveal,.exp-item');
    const io = new IntersectionObserver(e => e.forEach(el => { if (el.isIntersecting) el.target.classList.add('visible'); }), { threshold: .12 });
    revEls.forEach(el => io.observe(el));

    let sbDone = false;
    const sbObs = new IntersectionObserver(e => {
      if (e[0].isIntersecting && !sbDone) { sbDone = true; setTimeout(() => document.querySelectorAll('.skill-fill').forEach(f => { f.style.width = f.dataset.pct + '%'; }), 300); }
    }, { threshold: .2 });
    const skillSec = document.querySelector('#skills');
    if (skillSec) sbObs.observe(skillSec);

    // ── END SCREEN LAYOUT ──
    // Schaalt .ge-center (tekst + badge) als één blok binnen de middelste kolom.
    // transform-origin: top center — blok schaalt naar beneden, niet naar het midden.
    // Na schalen wordt phantom-space onder het blok gecorrigeerd via marginBottom.
    const updateEndLayout = (function () {
      const center = document.querySelector('.ge-center');
      const colCenter = document.querySelector('.ge-col-center');
      if (!center) return function () { };

      let BLOCK_W = 0;
      let BLOCK_H = 0;
      let lastColW = 0;

      function layout() {
        const colW = colCenter ? colCenter.offsetWidth : window.innerWidth;

        // Meet opnieuw als kolombreedte significant verandert
        if (!BLOCK_H || Math.abs(colW - lastColW) > 20) {
          center.style.transform = 'scale(1)';
          center.style.marginBottom = '';
          BLOCK_W = center.scrollWidth;
          BLOCK_H = center.offsetHeight;
          lastColW = colW;
          if (!BLOCK_H) return;
        }

        // Schaal zodat de inhoud past in de kolom
        const wScale = (colW - 40) / BLOCK_W;
        const scale = Math.max(0.45, Math.min(1, wScale));
        center.style.transform = 'scale(' + scale + ')';

        // Compenseer de phantom-ruimte die transform achterlaat
        if (scale < 1) {
          center.style.marginBottom = '-' + (BLOCK_H * (1 - scale)) + 'px';
        } else {
          center.style.marginBottom = '';
        }
      }

      window.addEventListener('resize', layout);
      return layout;
    })();

