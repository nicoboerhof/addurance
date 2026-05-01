// ─── Stuk 1: Globale variabelen en initiële setup ───

// Navigatie
const mainNav = document.getElementById("main-nav");
const burger = document.getElementById("nav-burger");
const drawer = document.getElementById("nav-drawer");

// Canvas game
const gameCanvas = document.getElementById("game-canvas");
const ctx = gameCanvas.getContext("2d", { alpha: false });
let devicePixelRatioValue = Math.min(window.devicePixelRatio || 1, 2);

const gameContainer = document.getElementById("game-container");
const gameStart = document.getElementById("game-start");
const startBtn = document.getElementById("start-btn");
const fsCloseBtn = document.getElementById("fs-close-btn");
const skillPopup = document.getElementById("skill-popup");
const jumpTip = document.getElementById("jump-tip");
const gameEnd = document.getElementById("game-end");
const replayBtn = document.getElementById("replay-btn");
const scrollCta = document.getElementById("scroll-cta");
const nav = document.querySelector("nav");
const heroSection = document.getElementById("hero");

// Images
const bgImg = new Image();
bgImg.src = "../images/bg.jpg";

const autoBgImg = new Image();
autoBgImg.src = "../game/auto_bg.png";

const wheelLeftImg = new Image();
wheelLeftImg.src = "../game/wiel_links.png";

const wheelRightImg = new Image();
wheelRightImg.src = "../game/wiel_rechts.png";

const headImg = new Image();
headImg.src = "../game/hoofd.png";

const productAImg = new Image();
productAImg.src = "../products/aardbeien.png";

const productBImg = new Image();
productBImg.src = "../products/borrelplank.png";

const productCImg = new Image();
productCImg.src = "../products/cupasoup.png";

const productDImg = new Image();
productDImg.src = "../products/salades.png";

const productEImg = new Image();
productEImg.src = "../products/sapjes.png";

const productFImg = new Image();
productFImg.src = "../products/soep.png";

const uiScoreImg = new Image();
uiScoreImg.src = "../game/UI_Score.svg";

const uiTimerImg = new Image();
uiTimerImg.src = "../game/UI_Timer.svg";

// Game state
let gameState = "start";
let gameTick = 0;
let animationTick = 0;
let animationFrameId = null;
let speed = 0;
let jumpTimer = 0;
let particles = [];
let score = 0;
let timer = 0;
let jumpOffset = 0;
let otherValue = 0;

const heroBounds = { screenX: 0, y: 0, w: 0, h: 0 };
const canvasWidth = 1280;
const canvasHeight = 720;
const speedFactor = 3.8;
const viewportHeight = canvasHeight;
const moveStep = 16;
const jumpHeight = 11;
const collisionRadius = 90;
const keysPressed = {};

const collectibles = [
  { worldX: 700, name: "After Effects", detail: "Expert · 15+ jaar dagelijks gebruik", glowColor: "#9b59ff", iconBg: "#0c0020", iconImg: productAImg },
  { worldX: 1420, name: "Premiere Pro", detail: "15 jaar professionele video-editing", glowColor: "#5b8fff", iconBg: "#00102a", iconImg: productBImg },
  { worldX: 2100, name: "Social Video", detail: "Campagnes voor Škoda, L'Oréal & meer", glowColor: "#c0c0c0", iconBg: "#1c1c1c", iconImg: productCImg },
  { worldX: 2840, name: "15 Jaar Werkervaring", detail: "Senior-level creative & motion expertise", glowColor: "#ffd700", iconBg: "#1a1200", iconImg: productFImg },
  { worldX: 3540, name: "Figma · UI Design", detail: "Interface design & prototyping", glowColor: "#a259ff", iconBg: "#110020", iconImg: productDImg },
  { worldX: 4220, name: "HTML5 · Display Advertising", detail: "Banner tooling & interactieve HTML-ads", glowColor: "#f07340", iconBg: "#1a0c00", iconImg: productEImg },
  { worldX: 4960, name: "After Effects · Motion", detail: "Motion graphics & complexe animaties", glowColor: "#9b59ff", iconBg: "#0c0020", iconImg: productAImg },
  { worldX: 5720, name: "Klaar voor Kruidvat Studio ⭐", detail: "Senior Video Editor · Motion Designer", glowColor: "#295813", iconBg: "#0a2005", iconImg: productCImg }
];

let fontScore = "";
let fontTimer = "";
let fontCollectible = "";

// ─── Stuk 2: Canvas game functies ───

// Initialiseer collectibles
function initCollectibles() {
  collectibles.forEach(c => {
    c.collected = false;
    c.active = false;
    c.fallY = -150;
    c.screenX = 0;
    c.phase = Math.random() * Math.PI * 2;
  });
}
initCollectibles();

// Update canvas grootte en scaling
function updateCanvasSize() {
  let ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (ratio !== devicePixelRatioValue) {
    devicePixelRatioValue = ratio;
    gameCanvas.width = canvasWidth * ratio;
    gameCanvas.height = canvasHeight * ratio;
    gameCanvas.style.width = canvasWidth + "px";
    gameCanvas.style.height = canvasHeight + "px";
  }

  const a = gameContainer;
  const vw = window.visualViewport;
  const offsetTop = document.body.classList.contains("game-playing") ? 0 : 60;
  const width = (vw ? vw.width : null) || a.clientWidth || window.innerWidth;
  const height = (vw ? vw.height - offsetTop : null) || a.clientHeight || window.innerHeight - offsetTop;

  const scaleX = width / canvasWidth;
  const scaleY = height / canvasHeight;
  const scale = Math.max(0.1, Math.min(scaleX, scaleY));
  gameCanvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
  gameCanvas.style.transformOrigin = "center center";
  gameCanvas.style.position = "absolute";
  gameCanvas.style.left = "50%";
  gameCanvas.style.top = "50%";

  // Hero bounds
  const bgAspect = autoBgImg.complete && autoBgImg.naturalWidth > 0 ? autoBgImg.naturalWidth / autoBgImg.naturalHeight : 1.648;
  heroBounds.screenX = 0.35 * canvasWidth;
  heroBounds.h = 0.38 * canvasHeight;
  heroBounds.w = heroBounds.h * bgAspect;
  heroBounds.y = viewportHeight - heroBounds.h;
}

// Draw background
function drawBackground() {
  if (bgImg.complete && bgImg.naturalWidth > 0) {
    const scale = Math.max(canvasWidth / bgImg.naturalWidth, canvasHeight / bgImg.naturalHeight);
    const w = bgImg.naturalWidth * scale;
    const h = bgImg.naturalHeight * scale;
    const yOffset = (canvasHeight - h) / 2;
    for (let x = -(gameTick % w); x < canvasWidth + w; x += w) {
      ctx.drawImage(bgImg, x, yOffset, w, h);
    }
  } else {
    ctx.fillStyle = "#0d0202";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
}

// Draw floor shadow
function drawFloorShadow() {
  const floorY = viewportHeight;
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(0, floorY, canvasWidth, canvasHeight - floorY);
}

// Draw wheel, head, products etc. utility
function drawImageCentered(img, x, y, size, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
  }
  ctx.restore();
}

// Draw collectibles
function drawCollectibles() {
  collectibles.forEach(c => {
    if (c.active && !c.collected) {
      if (!c.iconImg.complete || c.iconImg.naturalWidth === 0) return;
      const x = c.screenX;
      const y = c.fallY;
      const alpha = Math.max(0, 1 - Math.abs(x - heroBounds.screenX) / 220);
      if (alpha < 0.15) return;

      ctx.save();
      ctx.shadowColor = c.glowColor;
      ctx.shadowBlur = 8 + 18 * alpha;
      ctx.globalAlpha = 1;
      ctx.drawImage(c.iconImg, x - 67.5, y - c.iconImg.naturalHeight / c.iconImg.naturalWidth * 135 / 2, 135, c.iconImg.naturalHeight / c.iconImg.naturalWidth * 135);
      ctx.restore();
    }
  });
}

// Update collectibles physics
function updateCollectibles(delta) {
  collectibles.forEach(c => {
    if (!c.active) return;
    c.fallY += jumpHeight * delta;
    if (c.fallY >= viewportHeight - 0.88 * heroBounds.h && Math.abs(c.screenX - heroBounds.screenX) < collisionRadius) {
      score++;
      c.active = false;
      c.fallY = -150;
    }
    if (c.fallY > viewportHeight + 120) {
      c.active = false;
      c.fallY = -150;
    }
  });
}

// Game loop
function gameLoop(timestamp) {
  animationFrameId = requestAnimationFrame(gameLoop);

  const delta = 1; // eenvoudige framerate compensatie, kan uitbreiden
  gameTick += delta;

  ctx.setTransform(devicePixelRatioValue, 0, 0, devicePixelRatioValue, 0, 0);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  drawBackground();
  drawFloorShadow();
  drawCollectibles();
  updateCollectibles(delta);
}

// Start the game loop
animationFrameId = requestAnimationFrame(gameLoop);

// Resize handling
window.addEventListener("resize", updateCanvasSize);
window.addEventListener("orientationchange", () => setTimeout(updateCanvasSize, 300));
updateCanvasSize();

// ─── Stuk 3: Event listeners, navigatie en UI ───

// ─── Navigatie & burger menu ───
burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  navDrawer.classList.toggle("open");
});

drawerLinks.forEach(link => {
  link.addEventListener("click", () => {
    burger.classList.remove("open");
    navDrawer.classList.remove("open");
  });
});

// ─── Scroll & hero observer ───
window.addEventListener("scroll", () => {
  mainNav.classList.toggle("scrolled", window.scrollY > 10);
}, { passive: true });

const heroObserver = new IntersectionObserver(([entry]) => {
  mainNav.classList.toggle("over-hero", entry.isIntersecting);
}, { threshold: 0 });

heroObserver.observe(heroSection);

// ─── Button controls voor game ───
["touchstart", "mousedown"].forEach(evt => {
  btnLeft.addEventListener(evt, e => { e.preventDefault(); keys.ArrowLeft = true; }, { passive: false });
  btnRight.addEventListener(evt, e => { e.preventDefault(); keys.ArrowRight = true; }, { passive: false });
});

["touchend", "touchcancel", "mouseup"].forEach(evt => {
  btnLeft.addEventListener(evt, e => { e.preventDefault(); keys.ArrowLeft = false; }, { passive: false });
  btnRight.addEventListener(evt, e => { e.preventDefault(); keys.ArrowRight = false; }, { passive: false });
});

// ─── Fullscreen / game start / reset ───
startBtn.addEventListener("click", () => {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    const fsRequest = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
    fsRequest && fsRequest.call(document.documentElement).catch(() => {});
  }

  gameState = "intro";
  gameTick = 0;
  score = 0;
  collectiblesCollected = 0;
  initCollectibles();

  gameContainer.classList.add("game-active");
  document.body.classList.add("game-playing");
  requestAnimationFrame(gameLoop);
});

// Close fullscreen / exit game
fsCloseBtn.addEventListener("click", () => {
  const fsExit = document.exitFullscreen || document.webkitExitFullscreen;
  if (fsExit && (document.fullscreenElement || document.webkitFullscreenElement)) {
    fsExit.call(document);
  }
  resetGame();
});

// Reset game helper
function resetGame() {
  cancelAnimationFrame(animationFrameId);
  animationFrameId = null;
  gameState = "start";
  gameContainer.classList.remove("game-active");
  document.body.classList.remove("game-playing");
  score = 0;
  gameTick = 0;
  initCollectibles();
  heroBounds.screenX = 0.35 * canvasWidth;
}

// ─── Keyboard input ───
window.addEventListener("keydown", e => {
  keys[e.code] = true;
  if (e.code === "Escape" && gameState !== "start") resetGame();
});
window.addEventListener("keyup", e => keys[e.code] = false);

// ─── Visibility change ───
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && gameState !== "start" && gameState !== "end" && !animationFrameId) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
});

// ─── Reveal / scroll animations ───
const revealElements = document.querySelectorAll(".reveal, .exp-item");
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.12 });

revealElements.forEach(el => revealObserver.observe(el));

// Skill bars animation
let skillBarsDone = false;
const skillObserver = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !skillBarsDone) {
    skillBarsDone = true;
    setTimeout(() => {
      document.querySelectorAll(".skill-fill").forEach(bar => {
        bar.style.width = bar.dataset.pct + "%";
      });
    }, 300);
  }
}, { threshold: 0.2 });

const skillSection = document.querySelector("#skills");
skillSection && skillObserver.observe(skillSection);

// ─── End screen layout update ───
function updateEndLayout() {
  const centerEl = document.querySelector(".ge-center");
  const colCenterEl = document.querySelector(".ge-col-center");
  if (!centerEl) return;

  let prevWidth = 0, prevHeight = 0;

  function adjustLayout() {
    const containerWidth = colCenterEl ? colCenterEl.offsetWidth : window.innerWidth;
    if (!prevHeight || Math.abs(containerWidth - prevWidth) > 20) {
      centerEl.style.transform = "scale(1)";
      centerEl.style.marginBottom = "";
      prevWidth = containerWidth;
    }
  }

  window.addEventListener("resize", adjustLayout);
  adjustLayout();
}