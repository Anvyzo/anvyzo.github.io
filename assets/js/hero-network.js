/* ============================================================
   Anvyzo - hero-network.js
   Interactive node/data network behind the hero (Canvas 2D).
   Mouse-reactive; pauses when off-screen; static frame under
   reduced-motion; fully decorative (no-op if canvas unsupported).
   ============================================================ */
(function () {
  "use strict";

  var canvas = document.querySelector(".hero-canvas");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var nodes = [];
  var pulses = [];
  var mouse = { x: -9999, y: -9999, active: false };
  var LINK = 150;            // link distance
  var running = false, raf = 0;

  var COLORS = ["34,211,238", "124,92,255", "45,226,182"]; // cyan, violet, teal

  function size() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.max(1, Math.floor(W * dpr));
    canvas.height = Math.max(1, Math.floor(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function build() {
    var count = Math.max(26, Math.min(90, Math.floor((W * H) / 16000)));
    nodes = [];
    for (var i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        c: COLORS[i % COLORS.length]
      });
    }
    pulses = [];
    for (var p = 0; p < 7; p++) pulses.push(spawnPulse());
  }

  function spawnPulse() {
    var a = (Math.random() * nodes.length) | 0;
    var b = a;
    var best = 1e9;
    for (var j = 0; j < nodes.length; j++) {
      if (j === a) continue;
      var d = dist(nodes[a], nodes[j]);
      if (d < best && d > 8) { best = d; b = j; }
    }
    return { a: a, b: b, t: Math.random(), speed: 0.004 + Math.random() * 0.006, c: COLORS[(Math.random() * 3) | 0] };
  }

  function dist(p, q) { var dx = p.x - q.x, dy = p.y - q.y; return Math.sqrt(dx * dx + dy * dy); }

  function step() {
    ctx.clearRect(0, 0, W, H);

    // move nodes
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;

      // gentle mouse repulsion
      if (mouse.active) {
        var dx = n.x - mouse.x, dy = n.y - mouse.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 14000 && d2 > 1) {
          var f = (14000 - d2) / 14000 * 0.6;
          var d = Math.sqrt(d2);
          n.x += (dx / d) * f; n.y += (dy / d) * f;
        }
      }
    }

    // links
    for (var a = 0; a < nodes.length; a++) {
      for (var b = a + 1; b < nodes.length; b++) {
        var d = dist(nodes[a], nodes[b]);
        if (d < LINK) {
          var o = (1 - d / LINK) * 0.6;
          ctx.strokeStyle = "rgba(" + nodes[a].c + "," + o.toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[a].x, nodes[a].y);
          ctx.lineTo(nodes[b].x, nodes[b].y);
          ctx.stroke();
        }
      }
      // link to cursor
      if (mouse.active) {
        var dc = dist(nodes[a], mouse);
        if (dc < LINK * 1.3) {
          ctx.strokeStyle = "rgba(" + nodes[a].c + "," + ((1 - dc / (LINK * 1.3)) * 0.55).toFixed(3) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[a].x, nodes[a].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    // nodes
    for (var k = 0; k < nodes.length; k++) {
      ctx.fillStyle = "rgba(" + nodes[k].c + ",0.95)";
      ctx.beginPath();
      ctx.arc(nodes[k].x, nodes[k].y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // data pulses
    for (var pi = 0; pi < pulses.length; pi++) {
      var pu = pulses[pi];
      pu.t += pu.speed;
      if (pu.t >= 1 || pu.a >= nodes.length || pu.b >= nodes.length) { pulses[pi] = spawnPulse(); continue; }
      var na = nodes[pu.a], nb = nodes[pu.b];
      var x = na.x + (nb.x - na.x) * pu.t;
      var y = na.y + (nb.y - na.y) * pu.t;
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(" + pu.c + ",0.9)";
      ctx.fillStyle = "rgba(" + pu.c + ",1)";
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function loop() { if (!running) return; step(); raf = requestAnimationFrame(loop); }
  function start() { if (running || reduced) return; running = true; loop(); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

  function init() {
    size(); build();
    if (reduced) { step(); return; }   // single static frame

    var hero = document.querySelector(".hero");
    var heroBox = canvas;
    heroBox.parentElement.addEventListener("mousemove", function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.active = true;
    });
    heroBox.parentElement.addEventListener("mouseleave", function () { mouse.active = false; mouse.x = -9999; mouse.y = -9999; });

    if ("IntersectionObserver" in window && hero) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.02 }).observe(hero);
    } else {
      start();
    }

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { size(); build(); }, 200);
    });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
