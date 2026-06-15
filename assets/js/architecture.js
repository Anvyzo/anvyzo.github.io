/* ============================================================
   Anvyzo - architecture.js
   Scroll-built system pipeline: pipes draw between nodes when the
   diagram enters view, then data pulses flow continuously.
   Canvas 2D overlay behind the HTML node boxes. Degradation-safe.
   ============================================================ */
(function () {
  "use strict";

  var stage = document.querySelector(".arch__stage");
  var canvas = document.querySelector(".arch-canvas");
  if (!stage || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var nodeEls = Array.prototype.slice.call(stage.querySelectorAll(".arch-node"));
  if (nodeEls.length < 2) return;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var pts = [];
  var build = 0;            // 0..1 build progress
  var building = false, built = false;
  var pulses = [];
  var last = 0, spawnAcc = 0, raf = 0, running = false;
  var SEGS = function () { return pts.length - 1; };

  function size() {
    var r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.max(1, Math.floor(W * dpr));
    canvas.height = Math.max(1, Math.floor(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    computePoints(r);
  }

  function computePoints(stageRect) {
    pts = nodeEls.map(function (el) {
      var b = el.getBoundingClientRect();
      return { x: b.left - stageRect.left + b.width / 2, y: b.top - stageRect.top + b.height / 2 };
    });
  }

  function pointAt(s) {
    // s in [0, SEGS]
    var seg = Math.min(Math.floor(s), SEGS() - 1);
    var f = s - seg;
    var a = pts[seg], b = pts[seg + 1];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }

  function drawPipeSegment(a, b, frac) {
    var ex = a.x + (b.x - a.x) * frac, ey = a.y + (b.y - a.y) * frac;
    var g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, "rgba(124,92,255,0.8)");
    g.addColorStop(1, "rgba(45,226,182,0.8)");
    ctx.save();
    ctx.strokeStyle = g;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "rgba(34,211,238,0.5)";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var segs = SEGS();
    var drawn = build * segs;

    for (var i = 0; i < segs; i++) {
      if (i < Math.floor(drawn)) drawPipeSegment(pts[i], pts[i + 1], 1);
      else if (i === Math.floor(drawn)) drawPipeSegment(pts[i], pts[i + 1], drawn - i);
    }

    // pulses
    for (var p = 0; p < pulses.length; p++) {
      var pos = pointAt(pulses[p].s);
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = "rgba(34,211,238,0.95)";
      ctx.fillStyle = "rgba(34,211,238,1)";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function frame(now) {
    if (!running) return;
    var dt = last ? (now - last) / 1000 : 0;
    last = now;

    if (building && build < 1) {
      build = Math.min(1, build + dt / 1.3);   // ~1.3s build
      if (build >= 1) { building = false; built = true; }
    }

    if (built) {
      spawnAcc += dt;
      if (spawnAcc > 0.9 && pulses.length < 4) { spawnAcc = 0; pulses.push({ s: 0 }); }
      for (var p = pulses.length - 1; p >= 0; p--) {
        pulses[p].s += dt * 1.2;               // ~1.2 segments/sec
        if (pulses[p].s >= SEGS()) pulses.splice(p, 1);
      }
    }

    draw();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced) return;
    running = true; building = !built; last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

  function init() {
    size();
    if (reduced) { build = 1; built = true; draw(); return; }   // static full pipes

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.15 }).observe(stage);
    } else { start(); }

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(size, 200);
    });
    window.addEventListener("load", size);
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
