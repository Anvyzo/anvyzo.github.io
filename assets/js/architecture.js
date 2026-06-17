/* ============================================================
   Anvyzo - architecture.js
   A real cloud architecture that assembles as you scroll:
   each component appears in order and its connections draw in,
   then live data pulses flow through the system.

   Rendering only (Canvas 2D for edges + pulses; HTML boxes for
   nodes). Scroll progress is driven externally by scroll.js
   (pin + scrub) via window.archDiagram.setProgress(); falls back
   to a self-contained IntersectionObserver build if no one takes
   control (reduced-motion / blocked CDN / mobile). Degradation-safe.
   ============================================================ */
(function () {
  "use strict";

  var map = document.querySelector(".arch__map");
  var canvas = document.querySelector(".arch-canvas");
  if (!map || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // appear-progress per node (0..1)
  var NODES = [
    { id: "users", at: 0.00 },
    { id: "route53", at: 0.05 },
    { id: "cloudfront", at: 0.10 },
    { id: "waf", at: 0.15 },
    { id: "alb", at: 0.20 },
    { id: "api", at: 0.25 },
    { id: "cache", at: 0.30 },
    { id: "rds", at: 0.35 },
    { id: "workers", at: 0.40 },
    { id: "sqs", at: 0.44 },
    { id: "s3", at: 0.50 },
    { id: "sagemaker", at: 0.55 },
    { id: "cloudwatch", at: 0.60 },
    { id: "githubactions", at: 0.66 },
    { id: "ecr", at: 0.70 },
    { id: "airflow", at: 0.76 },
    { id: "databricks", at: 0.82 },
    { id: "redshift", at: 0.88 }
  ];

  // edges with build window {start, len}
  var EDGES = [
    { a: "users", b: "route53", start: 0.05, len: 0.04 },
    { a: "route53", b: "cloudfront", start: 0.10, len: 0.04 },
    { a: "cloudfront", b: "waf", start: 0.15, len: 0.04 },
    { a: "waf", b: "alb", start: 0.20, len: 0.04 },
    { a: "alb", b: "api", start: 0.25, len: 0.04 },
    { a: "api", b: "cache", start: 0.30, len: 0.04 },
    { a: "api", b: "rds", start: 0.35, len: 0.04 },
    { a: "api", b: "sqs", start: 0.40, len: 0.04 },
    { a: "sqs", b: "workers", start: 0.44, len: 0.04 },
    { a: "workers", b: "rds", start: 0.47, len: 0.04 },
    { a: "api", b: "s3", start: 0.50, len: 0.04 },
    { a: "api", b: "sagemaker", start: 0.55, len: 0.04 },
    { a: "cloudwatch", b: "api", start: 0.60, len: 0.04, dashed: true },
    { a: "cloudwatch", b: "workers", start: 0.62, len: 0.04, dashed: true },
    { a: "githubactions", b: "ecr", start: 0.66, len: 0.04 },
    { a: "ecr", b: "api", start: 0.70, len: 0.05, dashed: true },
    { a: "s3", b: "airflow", start: 0.76, len: 0.04 },
    { a: "rds", b: "airflow", start: 0.78, len: 0.04, dashed: true },
    { a: "airflow", b: "databricks", start: 0.82, len: 0.04 },
    { a: "databricks", b: "redshift", start: 0.88, len: 0.04 }
  ];

  // pulse routes (followed once the system is fully built)
  var PATHS = [
    ["users", "route53", "cloudfront", "waf", "alb", "api", "rds"],
    ["api", "sqs", "workers", "rds"],
    ["s3", "airflow", "databricks", "redshift"],
    ["githubactions", "ecr", "api"]
  ];

  var els = {};
  NODES.forEach(function (n) { els[n.id] = map.querySelector('[data-id="' + n.id + '"]'); });
  var vpcEl = map.querySelector(".arch-vpc");

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, centers = {};
  var progress = 0, controlled = false, visible = false, building = false;
  var pulses = [], spawnAcc = 0, last = 0, raf = 0, running = false;

  function isDesktop() { return window.matchMedia("(min-width: 760px)").matches; }

  function layout() {
    var r = map.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.max(1, Math.floor(W * dpr));
    canvas.height = Math.max(1, Math.floor(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    centers = {};
    NODES.forEach(function (n) {
      var el = els[n.id]; if (!el) return;
      var b = el.getBoundingClientRect();
      centers[n.id] = { x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 };
    });
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function applyNodes() {
    NODES.forEach(function (n) {
      var el = els[n.id]; if (!el) return;
      var a = clamp01((progress - n.at) / 0.05);
      el.style.opacity = a;
      el.style.transform = "translate(-50%, -50%) scale(" + (0.86 + 0.14 * a) + ")";
    });
    if (vpcEl) vpcEl.style.opacity = clamp01((progress - 0.2) / 0.06);
  }

  function drawEdge(e) {
    var A = centers[e.a], B = centers[e.b];
    if (!A || !B) return;
    var frac = clamp01((progress - e.start) / e.len);
    if (frac <= 0) return;
    var ex = A.x + (B.x - A.x) * frac, ey = A.y + (B.y - A.y) * frac;
    var g = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
    g.addColorStop(0, "rgba(124,92,255,0.85)");
    g.addColorStop(1, "rgba(45,226,182,0.85)");
    ctx.save();
    ctx.strokeStyle = g;
    ctx.lineWidth = e.dashed ? 1.5 : 2.4;
    if (e.dashed) ctx.setLineDash([5, 6]);
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(34,211,238,0.45)";
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();
  }

  function advancePulses(dt) {
    if (progress < 0.96) { pulses.length = 0; return; }
    spawnAcc += dt;
    if (spawnAcc > 0.7 && pulses.length < 6) {
      spawnAcc = 0;
      pulses.push({ p: (Math.random() * PATHS.length) | 0, seg: 0, t: 0 });
    }
    for (var i = pulses.length - 1; i >= 0; i--) {
      var pu = pulses[i];
      pu.t += dt * 1.1;
      while (pu.t >= 1) { pu.t -= 1; pu.seg++; }
      if (pu.seg >= PATHS[pu.p].length - 1) { pulses.splice(i, 1); }
    }
  }

  function drawPulses() {
    for (var i = 0; i < pulses.length; i++) {
      var path = PATHS[pulses[i].p];
      var A = centers[path[pulses[i].seg]], B = centers[path[pulses[i].seg + 1]];
      if (!A || !B) continue;
      var x = A.x + (B.x - A.x) * pulses[i].t, y = A.y + (B.y - A.y) * pulses[i].t;
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = "rgba(34,211,238,0.95)";
      ctx.fillStyle = "rgba(34,211,238,1)";
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function render() {
    if (!isDesktop()) { ctx.clearRect(0, 0, W, H); return; }
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < EDGES.length; i++) drawEdge(EDGES[i]);
    drawPulses();
  }

  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (!controlled && building && progress < 1) {
      progress = clamp01(progress + dt / 1.8);   // ~1.8s self-build
      if (progress >= 1) building = false;
    }
    advancePulses(dt);
    applyNodes();
    render();
    raf = requestAnimationFrame(frame);
  }

  function start() { if (running) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

  /* --- public API for scroll.js --- */
  window.archDiagram = {
    setProgress: function (p) { progress = clamp01(p); },
    takeControl: function () { controlled = true; building = false; },
    resize: function () { layout(); }
  };

  function init() {
    layout();

    if (reduced) { progress = 1; applyNodes(); render(); return; }   // static, full

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          visible = true;
          if (!controlled && progress < 1) building = true;
          start();
        } else { visible = false; stop(); }
      }, { threshold: 0.12 }).observe(map);
    } else {
      if (!controlled) { progress = 1; }
      start();
    }

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(layout, 200);
    });
    window.addEventListener("load", layout);
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
