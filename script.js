// ========================================================================
//   UIpen site — chaos engine
// ========================================================================
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ------------------------------------------------------------------------
// Boot sequence — dismiss after ~1.2s
// ------------------------------------------------------------------------
(() => {
  const boot = document.getElementById("boot");
  if (!boot) return;
  const dismiss = () => boot.classList.add("done");
  if (prefersReducedMotion) { dismiss(); return; }
  setTimeout(dismiss, 1200);
  // also dismiss on any user input
  ["click", "keydown", "pointerdown"].forEach((ev) =>
    window.addEventListener(ev, dismiss, { once: true })
  );
})();

// ------------------------------------------------------------------------
// Canvas background — animated grid with drifting nodes
// ------------------------------------------------------------------------
(() => {
  if (prefersReducedMotion) return;
  const c = document.getElementById("bg-canvas");
  if (!c) return;
  const ctx = c.getContext("2d");
  let w, h, dpr;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = c.width = window.innerWidth * dpr;
    h = c.height = window.innerHeight * dpr;
    c.style.width = window.innerWidth + "px";
    c.style.height = window.innerHeight + "px";
  };
  resize();
  window.addEventListener("resize", resize);

  // Drifting "particle" nodes — anchor points that we draw grid lines between
  const N = 38;
  const nodes = Array.from({ length: N }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.22 * dpr,
    vy: (Math.random() - 0.5) * 0.22 * dpr,
  }));

  // Mouse magnet — nodes gently drift toward cursor
  let mx = -9999, my = -9999;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX * dpr;
    my = e.clientY * dpr;
  });
  window.addEventListener("mouseout", () => { mx = -9999; my = -9999; });

  const CONNECT = 180 * dpr;

  function frame() {
    ctx.clearRect(0, 0, w, h);

    // step nodes
    for (const n of nodes) {
      // very gentle cursor attraction
      if (mx > -9000) {
        const dx = mx - n.x, dy = my - n.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 260000 * dpr * dpr && d2 > 1) {
          const f = 0.00004 * dpr;
          n.vx += dx * f;
          n.vy += dy * f;
        }
      }
      // cap velocity
      const v2 = n.vx * n.vx + n.vy * n.vy;
      const cap = 0.45 * dpr;
      if (v2 > cap * cap) {
        const s = cap / Math.sqrt(v2);
        n.vx *= s; n.vy *= s;
      }
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }

    // draw connection lines
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < CONNECT * CONNECT) {
          const alpha = (1 - Math.sqrt(d2) / CONNECT) * 0.15;
          ctx.strokeStyle = `rgba(94,106,210,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // draw nodes
    for (const n of nodes) {
      ctx.fillStyle = "rgba(134,145,240,0.4)";
      ctx.fillRect(n.x - dpr, n.y - dpr, 2 * dpr, 2 * dpr);
    }

    requestAnimationFrame(frame);
  }
  frame();
})();

// ------------------------------------------------------------------------
// Typewriter on hero prompt
// ------------------------------------------------------------------------
(() => {
  const target = document.getElementById("typed");
  if (!target) return;
  if (prefersReducedMotion) return;
  const phrases = [
    "UIpen_$ init",
    "UIpen_$ annotate --tool pin",
    "UIpen_$ knobs --live-preview",
    "UIpen_$ revert --lifo",
  ];
  let pi = 0, ci = 0, dir = 1;
  function tick() {
    const phrase = phrases[pi];
    ci += dir;
    target.textContent = phrase.slice(0, ci);
    if (dir === 1 && ci === phrase.length) {
      dir = -1;
      setTimeout(tick, 2400);
      return;
    }
    if (dir === -1 && ci === 0) {
      dir = 1;
      pi = (pi + 1) % phrases.length;
      setTimeout(tick, 400);
      return;
    }
    setTimeout(tick, dir === 1 ? 55 + Math.random() * 40 : 28);
  }
  setTimeout(tick, 1800);
})();

// ------------------------------------------------------------------------
// Scroll reveal
// ------------------------------------------------------------------------
(() => {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();

// ------------------------------------------------------------------------
// Nav — scrolled state + mobile menu
// ------------------------------------------------------------------------
(() => {
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toggle) toggle.addEventListener("click", () => nav.classList.toggle("menu-open"));
})();

// ------------------------------------------------------------------------
// Magnetic buttons — pull toward cursor within radius
// ------------------------------------------------------------------------
(() => {
  if (prefersReducedMotion) return;
  const targets = document.querySelectorAll(".magnetic");
  const RADIUS = 80;
  const PULL = 0.35;
  targets.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d < RADIUS) {
        el.style.transform = `translate(${dx * PULL}px, ${dy * PULL}px)`;
      }
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
})();

// ------------------------------------------------------------------------
// 3D tilt on feature cards
// ------------------------------------------------------------------------
(() => {
  if (prefersReducedMotion) return;
  const cards = document.querySelectorAll(".features-grid .card");
  const MAX = 6; // degrees
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-y * MAX).toFixed(2)}deg) rotateY(${(x * MAX).toFixed(2)}deg) translateZ(0)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
})();

// ------------------------------------------------------------------------
// Download platform-detect — highlight the OS the visitor is on.
// Non-blocking, no network calls. Reads navigator.userAgent + platform.
// ------------------------------------------------------------------------
(() => {
  const cards = document.querySelectorAll(".downloads .dl-card");
  if (!cards.length) return;

  const ua = (navigator.userAgent || "").toLowerCase();
  const plat = (navigator.platform || "").toLowerCase();

  let detected = null;
  if (/mac|iphone|ipad|ipod/.test(plat) || /mac os x|macintosh/.test(ua)) {
    detected = "macos";
  } else if (/linux/.test(plat) || /linux|x11/.test(ua)) {
    detected = "linux";
  } else if (/win/.test(plat) || /windows/.test(ua)) {
    detected = "windows";
  }

  if (!detected) return;

  for (const card of cards) {
    if (card.getAttribute("data-os") === detected) {
      card.setAttribute("data-current", "true");
      // Surface the detected card first in tab order so it's the default focus.
      card.parentElement.prepend(card);
      break;
    }
  }
})();

// ------------------------------------------------------------------------
// Copy buttons
// ------------------------------------------------------------------------
(() => {
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pre = btn.closest("pre");
      if (!pre) return;
      const code = pre.querySelector("code");
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.innerText);
        const prev = btn.textContent;
        btn.textContent = "copied ✓";
        btn.classList.add("copied");
        setTimeout(() => {
          btn.textContent = prev;
          btn.classList.remove("copied");
        }, 1500);
      } catch {
        btn.textContent = "select + copy";
      }
    });
  });
})();

// ------------------------------------------------------------------------
// Hero demo pin bob
// ------------------------------------------------------------------------
(() => {
  if (prefersReducedMotion) return;
  const pins = document.querySelectorAll(".hero-demo .pin");
  if (!pins.length) return;
  let tick = 0;
  setInterval(() => {
    const target = pins[tick % pins.length];
    if (!target) return;
    target.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.22)" }, { transform: "scale(1)" }],
      { duration: 720, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
    tick++;
  }, 2200);
})();

// ------------------------------------------------------------------------
// CHAOS MODE — the big one
// ------------------------------------------------------------------------
(() => {
  const btn = document.getElementById("chaosBtn");
  if (!btn) return;
  let active = false;
  const engage = () => {
    active = !active;
    document.body.classList.toggle("chaos", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    if (active) {
      btn.innerHTML = '<svg width="10" height="10" style="vertical-align:-1px;margin-right:6px"><use href="#i-zap"/></svg>Chaos //ON';
      flashMessage("CHAOS MODE ENGAGED");
    } else {
      btn.innerHTML = '<svg width="10" height="10" style="vertical-align:-1px;margin-right:6px"><use href="#i-zap"/></svg>Chaos';
      flashMessage("ORDER RESTORED");
    }
  };
  btn.addEventListener("click", engage);

  // Easter egg: type "chaos" anywhere
  let buf = "";
  window.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key.length === 1) {
      buf = (buf + e.key.toLowerCase()).slice(-5);
      if (buf === "chaos") {
        buf = "";
        engage();
      }
    }
  });
})();

// small ephemeral toast
function flashMessage(text) {
  const t = document.createElement("div");
  t.textContent = text;
  t.style.cssText = `
    position:fixed;top:82px;left:50%;transform:translateX(-50%);
    background:var(--void);color:var(--neon-g);
    border:1px solid var(--neon-g);
    padding:8px 16px;font:700 11px/1 var(--font-mono);
    letter-spacing:0.14em;text-transform:uppercase;
    z-index:200;box-shadow:0 0 18px rgba(191,255,0,0.4),3px 3px 0 0 var(--neon-m);
    animation:none;
  `;
  document.body.appendChild(t);
  t.animate(
    [
      { opacity: 0, transform: "translate(-50%, -8px)" },
      { opacity: 1, transform: "translate(-50%, 0)" },
      { opacity: 1, transform: "translate(-50%, 0)" },
      { opacity: 0, transform: "translate(-50%, -8px)" },
    ],
    { duration: 2200, easing: "cubic-bezier(0.22,1,0.36,1)" }
  ).onfinish = () => t.remove();
}

// ------------------------------------------------------------------------
// MATRIX RAIN — replaces the node grid when chaos is active
// Applied on top of the existing canvas by toggling a mode flag.
// We do this by listening for body class changes and re-assigning the
// animation strategy.
// ------------------------------------------------------------------------
(() => {
  if (prefersReducedMotion) return;
  const c = document.getElementById("bg-canvas");
  if (!c) return;
  const ctx = c.getContext("2d");

  const CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789UIPEN</>{}[]$_";
  const cols = [];
  let W = 0, H = 0;

  function setup() {
    W = c.width; H = c.height;
    cols.length = 0;
    const colW = 18;
    for (let x = 0; x < W; x += colW) {
      cols.push({ x, y: Math.random() * H, speed: 1 + Math.random() * 2.4, jitter: 0 });
    }
  }
  // Piggyback on resize — original canvas module also resizes; wait a tick
  setTimeout(setup, 50);
  window.addEventListener("resize", () => setTimeout(setup, 50));

  let chaos = false;
  const mo = new MutationObserver(() => {
    chaos = document.body.classList.contains("chaos") || document.body.classList.contains("chaos-forever");
  });
  mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  ctx.font = "14px JetBrains Mono, monospace";

  function frame() {
    if (chaos) {
      // fade the canvas darkly each frame for trail effect
      ctx.fillStyle = "rgba(5, 5, 10, 0.1)";
      ctx.fillRect(0, 0, W, H);
      for (const col of cols) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        const flash = Math.random() > 0.985;
        ctx.fillStyle = flash
          ? "rgba(255, 255, 255, 0.95)"
          : Math.random() > 0.92
          ? "rgba(255, 45, 149, 0.85)"
          : "rgba(191, 255, 0, 0.7)";
        ctx.fillText(ch, col.x, col.y);
        col.y += col.speed * 4;
        if (col.y > H + 20) {
          col.y = -20;
          col.speed = 1 + Math.random() * 2.4;
        }
      }
    }
    requestAnimationFrame(frame);
  }
  frame();
})();

// ------------------------------------------------------------------------
// CLICK RIPPLE — every click spawns a geometric pulse
// ------------------------------------------------------------------------
(() => {
  if (prefersReducedMotion) return;
  const layer = document.getElementById("rippleLayer");
  if (!layer) return;
  document.addEventListener("click", (e) => {
    // skip if click is inside a form input
    const t = e.target;
    if (!t) return;
    if (t.closest && t.closest("input, textarea, select")) return;
    const dot = document.createElement("div");
    dot.className = "ripple-dot";
    dot.style.left = e.clientX + "px";
    dot.style.top = e.clientY + "px";
    layer.appendChild(dot);
    setTimeout(() => dot.remove(), 700);
  });
})();

// ------------------------------------------------------------------------
// CURSOR TRAIL — only in hero section
// ------------------------------------------------------------------------
(() => {
  if (prefersReducedMotion) return;
  const hero = document.querySelector(".hero");
  if (!hero) return;
  let last = 0;
  hero.addEventListener("mousemove", (e) => {
    const now = performance.now();
    if (now - last < 18) return; // throttle
    last = now;
    const p = document.createElement("div");
    p.className = "cursor-particle";
    p.style.left = e.clientX + "px";
    p.style.top = e.clientY + "px";
    // random jitter so the trail scatters
    const jx = (Math.random() - 0.5) * 6;
    const jy = (Math.random() - 0.5) * 6;
    p.style.transform = `translate(calc(-50% + ${jx}px), calc(-50% + ${jy}px))`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 650);
  });
})();

// ------------------------------------------------------------------------
// GLITCH TEXT on reveal — scramble → resolve
// ------------------------------------------------------------------------
(() => {
  if (prefersReducedMotion) return;
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%&*<>/\\{}[]0123456789";
  const targets = document.querySelectorAll(".glitch-on-reveal");
  targets.forEach((el) => {
    // capture the original HTML once
    const orig = el.innerHTML;
    el.setAttribute("data-orig", orig);
  });
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target;
        const orig = el.getAttribute("data-orig") || el.innerHTML;
        // walk text nodes, scramble each char, then settle
        const textNodes = [];
        function collect(node) {
          if (node.nodeType === 3) textNodes.push({ node, original: node.textContent });
          else node.childNodes.forEach(collect);
        }
        collect(el);
        const start = performance.now();
        const DURATION = 420;
        function step() {
          const t = (performance.now() - start) / DURATION;
          textNodes.forEach(({ node, original }) => {
            let out = "";
            for (let i = 0; i < original.length; i++) {
              const ch = original[i];
              if (ch === " " || ch === "\n") { out += ch; continue; }
              if (i / original.length < t) { out += ch; }
              else { out += CHARS[Math.floor(Math.random() * CHARS.length)]; }
            }
            node.textContent = out;
          });
          if (t < 1) requestAnimationFrame(step);
          else el.innerHTML = orig;
        }
        // only glitch if element has a data-glitch attr OR is h2 in try-it
        requestAnimationFrame(step);
      }
    },
    { threshold: 0.35 }
  );
  targets.forEach((el) => io.observe(el));
})();

// ------------------------------------------------------------------------
// STATS — count up on view
// ------------------------------------------------------------------------
(() => {
  const stats = document.querySelectorAll(".stat-val[data-count]");
  if (!stats.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target;
        const end = Number(el.getAttribute("data-count"));
        const suffix = el.getAttribute("data-suffix") || "";
        if (prefersReducedMotion || end === 0) {
          el.textContent = String(end) + suffix;
          continue;
        }
        const start = performance.now();
        const dur = 1200;
        function step() {
          const t = Math.min(1, (performance.now() - start) / dur);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - t, 3);
          const v = Math.floor(end * eased);
          el.textContent = v.toLocaleString() + (t === 1 ? suffix : "");
          if (t < 1) requestAnimationFrame(step);
          else el.textContent = end.toLocaleString() + suffix;
        }
        requestAnimationFrame(step);
      }
    },
    { threshold: 0.4 }
  );
  stats.forEach((s) => io.observe(s));
})();

// ------------------------------------------------------------------------
// TRY-IT LIVE DEMO — fake UIpen on the landing page
// ------------------------------------------------------------------------
(() => {
  const shell = document.querySelector(".demo-shell");
  if (!shell) return;
  const stage = document.getElementById("demoStage");
  const log = document.getElementById("demoLog");
  const badge = document.getElementById("demoBadge");
  const toolbar = shell.querySelector(".demo-toolbar-real");
  if (!stage || !log || !badge || !toolbar) return;

  let tool = "pin";
  let busy = false;
  let pinCounter = 0;
  const appliedHistory = []; // { el, original: { css attrs } }

  // tool switching
  toolbar.querySelectorAll(".dt[data-dt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (busy) return;
      tool = btn.getAttribute("data-dt");
      toolbar.querySelectorAll(".dt[data-dt]").forEach((b) => {
        b.setAttribute("data-active", b === btn ? "true" : "false");
      });
    });
  });

  // reset
  toolbar.querySelector('[data-dt-action="reset"]').addEventListener("click", () => {
    if (busy) return;
    // undo CSS changes
    for (const item of appliedHistory) {
      for (const [prop, val] of Object.entries(item.original)) {
        item.el.style.setProperty(prop, val);
      }
    }
    appliedHistory.length = 0;
    stage.querySelectorAll(".fake-pin").forEach((p) => p.remove());
    stage.querySelectorAll(".shimmer-highlight").forEach((p) => p.remove());
    stage.querySelectorAll(".demo-target.resolved-demo").forEach((t) => t.classList.remove("resolved-demo"));
    stage.classList.remove("has-pin");
    pinCounter = 0;
    setBadge("idle");
    writeLog([{ text: "> session cleared.", kind: "muted" }]);
  });

  stage.addEventListener("click", (e) => {
    if (busy) return;
    const target = e.target.closest(".demo-target");
    if (!target) return;
    if (tool === "pin" || tool === "select" || tool === "region") {
      runAnnotation(target, e.clientX, e.clientY);
    } else if (tool === "knobs") {
      runKnob(target);
    }
  });

  function setBadge(state) {
    badge.className = "demo-badge " + state;
    badge.textContent = state;
  }

  function writeLog(lines) {
    log.innerHTML = "";
    for (const { text, kind } of lines) {
      const d = document.createElement("div");
      d.className = "log-line" + (kind ? " " + kind : "");
      d.textContent = text;
      log.appendChild(d);
    }
  }
  function appendLog(text, kind) {
    const d = document.createElement("div");
    d.className = "log-line" + (kind ? " " + kind : "");
    d.textContent = text;
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
  }

  // Canned "Claude responses" keyed by target label
  const RESPONSES = {
    "Primary button": [
      { applyTo: ".sample-btn", css: { "background-color": "#BFFF00", "color": "#0a0a12", "letter-spacing": "0.1em" },
        story: ["reading src/components/Button.tsx:14", "background: indigo → acid green", "letter-spacing: 0.06em → 0.1em"] },
      { applyTo: ".sample-btn", css: { "padding": "14px 28px", "font-size": "13px" },
        story: ["reading src/components/Button.tsx:14", "padding 10px 22px → 14px 28px for better touch target", "font-size 12px → 13px"] },
    ],
    "Price tag": [
      { applyTo: ".sample-price", css: { "color": "#FF2D95", "font-size": "34px", "text-shadow": "0 0 16px rgba(255,45,149,0.5)" },
        story: ["reading src/pages/index.tsx:88", "color → hot-magenta w/ glow", "font-size 28px → 34px for emphasis"] },
    ],
    "Label": [
      { applyTo: ".sample-label", css: { "color": "#BFFF00", "letter-spacing": "0.12em", "font-weight": "700" },
        story: ["reading src/components/Label.tsx:6", "strengthened hierarchy: weight 500 → 700", "letter-spacing 0.08em → 0.12em"] },
    ],
    "Card": [
      { applyTo: ".sample-card", css: { "border-color": "#5E6AD2", "box-shadow": "6px 6px 0 0 #FF2D95", "background": "rgba(94,106,210,0.06)" },
        story: ["reading src/components/Card.tsx:22", "pulled accent to border + offset shadow", "bg tinted +6% indigo"] },
    ],
  };
  const cycleIndex = {};

  function runAnnotation(target, clickX, clickY) {
    busy = true;
    stage.classList.add("has-pin");
    setBadge("sent");

    // drop pin at click point (coords relative to stage)
    const sr = stage.getBoundingClientRect();
    const pin = document.createElement("div");
    pinCounter++;
    pin.className = "fake-pin s-sent";
    const px = clickX - sr.left;
    const py = clickY - sr.top;
    pin.style.left = px + "px";
    pin.style.top = py + "px";
    pin.innerHTML = `<span>${pinCounter}</span>`;
    stage.appendChild(pin);

    // shimmer around target
    const tr = target.getBoundingClientRect();
    const sh = document.createElement("div");
    sh.className = "shimmer-highlight";
    sh.style.left = tr.left - sr.left - 4 + "px";
    sh.style.top = tr.top - sr.top - 4 + "px";
    sh.style.width = tr.width + 8 + "px";
    sh.style.height = tr.height + 8 + "px";
    stage.appendChild(sh);

    const label = target.getAttribute("data-label") || "element";

    writeLog([
      { text: "> POST /annotations", kind: "user" },
      { text: `  target: ${label}`, kind: "muted" },
      { text: `  tool: ${tool}`, kind: "muted" },
    ]);

    setTimeout(() => {
      setBadge("working");
      appendLog(`> claude working…`, kind_m());
    }, 500);

    setTimeout(() => {
      // apply the "edit"
      const candidates = RESPONSES[label] || RESPONSES["Card"];
      const idx = (cycleIndex[label] || 0) % candidates.length;
      cycleIndex[label] = idx + 1;
      const chosen = candidates[idx];
      const applyEl = target.querySelector(chosen.applyTo) || target;
      // snapshot originals
      const orig = {};
      for (const prop of Object.keys(chosen.css)) {
        orig[prop] = applyEl.style.getPropertyValue(prop);
      }
      appliedHistory.push({ el: applyEl, original: orig });

      for (const [prop, val] of Object.entries(chosen.css)) {
        applyEl.style.setProperty(prop, val);
      }

      for (const s of chosen.story) appendLog(`  ${s}`, "claude");

      sh.remove();
      pin.classList.remove("s-sent");
      pin.classList.add("s-resolved");
      target.classList.add("resolved-demo");
      setBadge("resolved");
      appendLog(`> resolve_annotation(${pinCounter}, files_changed: 1)`, "ok");
      busy = false;
    }, 1800);
  }

  function runKnob(target) {
    busy = true;
    setBadge("working");
    const label = target.getAttribute("data-label") || "element";
    const tr = target.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const sh = document.createElement("div");
    sh.className = "shimmer-highlight";
    sh.style.left = tr.left - sr.left - 4 + "px";
    sh.style.top = tr.top - sr.top - 4 + "px";
    sh.style.width = tr.width + 8 + "px";
    sh.style.height = tr.height + 8 + "px";
    stage.appendChild(sh);

    writeLog([
      { text: "> POST /knobs/request", kind: "user" },
      { text: `  target: ${label}`, kind: "muted" },
      { text: "> claude designing knobs…", kind: "m" },
    ]);

    setTimeout(() => {
      sh.remove();
      const applyEl = target.querySelector(".sample-btn, .sample-price, .sample-label, .sample-card") || target;
      const orig = {};
      const css = { "transform": "rotate(-2deg) scale(1.04)", "filter": "drop-shadow(0 4px 18px rgba(94,106,210,0.6))" };
      for (const prop of Object.keys(css)) orig[prop] = applyEl.style.getPropertyValue(prop);
      appliedHistory.push({ el: applyEl, original: orig });
      for (const [p, v] of Object.entries(css)) applyEl.style.setProperty(p, v);

      appendLog("  applied knobs: tilt=-2°, scale=1.04, glow", "claude");
      appendLog("> resolve_annotation(knobs) ✓", "ok");
      setBadge("resolved");
      target.classList.add("resolved-demo");
      busy = false;
    }, 1400);
  }

  function kind_m() { return "m"; } // neon magenta log line (class uses .m color)
})();

// ------------------------------------------------------------------------
// TERMINAL CONSOLE (backtick to toggle)
// ------------------------------------------------------------------------
(() => {
  const term = document.getElementById("termConsole");
  const body = document.getElementById("termBody");
  const input = document.getElementById("termInput");
  const close = document.getElementById("termClose");
  if (!term || !body || !input) return;

  const history = [];
  let hIdx = 0;

  function open() {
    term.classList.add("open");
    term.setAttribute("aria-hidden", "false");
    setTimeout(() => input.focus(), 100);
    if (!body.hasChildNodes()) {
      print("UIpen terminal v0.1.0 — /dev/null tty0", "ok");
      print('type "help" for commands. try "about", "install", "chaos", "stats".', "muted");
    }
  }
  function shut() {
    term.classList.remove("open");
    term.setAttribute("aria-hidden", "true");
  }
  function print(text, kind = "") {
    const line = document.createElement("div");
    line.className = "tl " + kind;
    line.textContent = text;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }
  function printPre(text, kind = "") {
    const line = document.createElement("div");
    line.className = "tl " + kind;
    const pre = document.createElement("pre");
    pre.textContent = text;
    line.appendChild(pre);
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  const commands = {
    help() {
      printPre(
        [
          "Available commands:",
          "  help       — this list",
          "  about      — what UIpen is",
          "  install    — scroll to install section",
          "  stats      — runtime stats",
          "  features   — list features",
          "  chaos      — toggle chaos mode",
          "  shortcuts  — keyboard shortcuts cheat sheet",
          "  github     — open GitHub",
          "  clear      — clear this terminal",
          "  exit       — close",
        ].join("\n"),
        "muted"
      );
    },
    about() {
      printPre(
        "UIpen — a dev-mode visual annotation layer that pipes\npins, regions, arrows, and live-preview knobs from your\nrunning React/Next/Astro app straight into Claude Code\nvia MCP channels.\n\nno cloud. no accounts. one script tag.",
        ""
      );
    },
    install() {
      print("scrolling to install…", "ok");
      document.getElementById("install")?.scrollIntoView({ behavior: "smooth" });
      setTimeout(shut, 500);
    },
    stats() {
      printPre(
        [
          "port            : 8787",
          "tools           : 7",
          "accents         : indigo / magenta / green / cyan",
          "annotations/min : ∞",
          "fps cap         : 60",
          "chaos mode      : " + (document.body.classList.contains("chaos") ? "engaged" : "stable"),
        ].join("\n"),
        ""
      );
    },
    features() {
      printPre(
        [
          "pin       — single-point comment",
          "region    — rect around a cluster",
          "arrow     — relationship between two elements",
          "select    — snap to exact component",
          "lasso     — freeform polygon OR click-to-toggle",
          "knobs     — tunable sliders with live preview",
          "hide (H)  — remove markers to review page clean",
        ].join("\n"),
        ""
      );
    },
    chaos() {
      document.getElementById("chaosBtn")?.click();
      print("chaos toggled.", "m");
    },
    shortcuts() {
      printPre(
        "V  cursor        |  P  pin           |  R  region\nA  arrow         |  S  select        |  L  lasso\nK  knobs         |  H  hide markers  |  Esc  cancel\n⌘/Ctrl+Enter  batch send    |  Enter  send one\n⌘/Ctrl+Z      revert last  |  type 'chaos' → glitch",
        ""
      );
    },
    github() {
      print("opening github…", "ok");
      window.open("https://github.com", "_blank");
    },
    clear() {
      body.innerHTML = "";
    },
    exit() { shut(); },
    quit() { shut(); },
  };

  function exec(raw) {
    const cmd = raw.trim();
    if (!cmd) return;
    print("uipen_$ " + cmd, "user");
    history.push(cmd);
    hIdx = history.length;
    const [name] = cmd.split(/\s+/);
    const fn = commands[name.toLowerCase()];
    if (fn) fn();
    else print("command not found: " + name + ' — type "help"', "err");
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const v = input.value;
      input.value = "";
      exec(v);
    } else if (e.key === "Escape") {
      e.preventDefault();
      shut();
    } else if (e.key === "ArrowUp") {
      if (hIdx > 0) { hIdx--; input.value = history[hIdx] || ""; }
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (hIdx < history.length) { hIdx++; input.value = history[hIdx] || ""; }
      e.preventDefault();
    }
  });
  close && close.addEventListener("click", shut);

  window.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "`" || e.key === "~") {
      e.preventDefault();
      if (term.classList.contains("open")) shut();
      else open();
    }
  });
})();

// ------------------------------------------------------------------------
// KONAMI CODE → chaos-forever
// ↑ ↑ ↓ ↓ ← → ← → B A
// ------------------------------------------------------------------------
(() => {
  const SEQ = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a",
  ];
  let i = 0;
  window.addEventListener("keydown", (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    const expected = SEQ[i];
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === expected) {
      i++;
      if (i === SEQ.length) {
        i = 0;
        document.body.classList.add("chaos", "chaos-forever");
        flashMessage("KONAMI: CHAOS LOCKED FOREVER");
      }
    } else {
      i = key === SEQ[0] ? 1 : 0;
    }
  });
})();
