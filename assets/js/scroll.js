/* ============================================================
   Anvyzo - scroll.js
   Lenis smooth scroll + GSAP/ScrollTrigger choreography.
   Degradation-safe: with reduced-motion or missing CDNs the
   site stays fully static and visible (this script early-returns
   and never adds the `js-anim` class that hides .reveal elements).
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasLibs = !!(window.gsap && window.ScrollTrigger && window.Lenis);
  if (reduced || !hasLibs) return;

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  // Activates the CSS that hides .reveal elements until animated.
  document.documentElement.classList.add("js-anim");

  /* ---------- Lenis smooth scroll, synced to GSAP ticker ---------- */
  var lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);

  // Route in-page anchor clicks through Lenis (also closes mobile menu).
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -70 });
    });
  });

  /* ---------- Scroll progress bar ---------- */
  var bar = document.querySelector(".scroll-progress");
  if (bar) {
    gsap.to(bar, {
      scaleX: 1, ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.3 }
    });
  }

  /* ---------- Reusable "assemble" reveal (fromTo => CSS-hide safe) ---------- */
  function rise(targets, opts) {
    opts = opts || {};
    if (!document.querySelector(typeof targets === "string" ? targets : "body")) return;
    return gsap.fromTo(targets,
      {
        opacity: 0,
        y: opts.y != null ? opts.y : 30,
        x: opts.x || 0,
        scale: opts.scale != null ? opts.scale : 1
      },
      {
        opacity: 1, y: 0, x: 0, scale: 1,
        duration: opts.duration || 0.8,
        ease: opts.ease || "power3.out",
        stagger: opts.stagger || 0,
        delay: opts.delay || 0,
        scrollTrigger: opts.noTrigger ? undefined : {
          trigger: opts.trigger || targets,
          start: opts.start || "top 84%"
        }
      });
  }

  /* ---------- Choreography ---------- */
  var mm = gsap.matchMedia();

  // Desktop / tablet: full cinematic treatment.
  mm.add("(min-width: 861px)", function () {
    // Hero entrance on load (no scroll trigger).
    rise(".hero .reveal", { y: 32, stagger: 0.12, delay: 0.15, duration: 1, noTrigger: true });

    // Background depth parallax.
    gsap.to(".bg-grid", { yPercent: 12, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
    gsap.to(".orb--1", { yPercent: 30, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
    gsap.to(".orb--2", { yPercent: -20, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });
    gsap.to(".orb--3", { yPercent: 18, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });

    // Hero content drifts + fades as it leaves.
    gsap.to(".hero__inner", {
      y: -60, opacity: 0.25, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });

    registerSections();

    // ONE tasteful pin: hold the Why heading while its points assemble.
    if (document.querySelector(".why .section-head")) {
      gsap.timeline({
        scrollTrigger: {
          trigger: ".why", start: "top top", end: "+=420",
          pin: ".why .section-head", pinSpacing: true
        }
      });
    }

    // Magnetic primary CTAs (fine pointer only).
    if (window.matchMedia("(pointer: fine)").matches) {
      document.querySelectorAll(".btn--primary").forEach(function (btn) {
        btn.classList.add("is-magnetic");
        var qx = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
        var qy = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });
        btn.addEventListener("mousemove", function (e) {
          var r = btn.getBoundingClientRect();
          qx((e.clientX - (r.left + r.width / 2)) * 0.3);
          qy((e.clientY - (r.top + r.height / 2)) * 0.4);
        });
        btn.addEventListener("mouseleave", function () { qx(0); qy(0); });
      });
    }

    return function () {}; // gsap.matchMedia auto-reverts tweens created here
  });

  // Mobile: lighter — reveals only, no parallax / pin / magnetic.
  mm.add("(max-width: 860px)", function () {
    rise(".hero .reveal", { y: 24, stagger: 0.08, duration: 0.7, noTrigger: true });
    registerSections();
    return function () {};
  });

  // Sections shared by both breakpoints.
  function registerSections() {
    // Positioning strip
    rise(".strip__values li", { trigger: ".strip", start: "top 90%", y: 20, duration: 0.6, ease: "power2.out", stagger: 0.08 });

    // Origin
    rise(".origin .section-head, .origin__text p", { trigger: ".origin", start: "top 78%", y: 28, stagger: 0.12 });
    rise(".meaning-card", { trigger: ".meaning-card", start: "top 82%", y: 40 });
    rise(".meaning-list li", { trigger: ".meaning-card", start: "top 78%", x: 24, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.14, delay: 0.15 });

    // Services grid "wave"
    rise(".services .section-head", { trigger: ".services", start: "top 80%", y: 28 });
    rise(".s-card", { trigger: ".cards-grid", start: "top 82%", y: 40, scale: 0.94, duration: 0.6, stagger: 0.06 });

    // How we work
    rise(".process .section-head", { trigger: ".process", start: "top 80%", y: 28 });
    rise(".step", { trigger: ".steps", start: "top 82%", y: 40, duration: 0.6, stagger: 0.12 });
    gsap.fromTo(".steps__line", { scaleX: 0 }, {
      scaleX: 1, ease: "none",
      scrollTrigger: { trigger: ".steps", start: "top 75%", end: "bottom 70%", scrub: true }
    });

    // Technical depth
    rise(".depth .section-head, .depth__maintain", { trigger: ".depth", start: "top 80%", y: 26, stagger: 0.1 });
    rise(".principles li", { trigger: ".principles", start: "top 85%", y: 18, duration: 0.5, ease: "power2.out", stagger: 0.08 });
    rise(".code-panel", { trigger: ".code-panel", start: "top 84%", y: 40, scale: 0.97 });
    rise(".code-panel__body code", { trigger: ".code-panel", start: "top 78%", y: 10, duration: 0.7, ease: "power2.out", delay: 0.2 });

    // Example work
    rise(".work .section-head", { trigger: ".work", start: "top 80%", y: 28 });
    rise(".work-card", { trigger: ".work-grid", start: "top 82%", y: 40, scale: 0.95, duration: 0.6, stagger: 0.1 });

    // Why
    rise(".why .section-head", { trigger: ".why", start: "top 82%", y: 28 });
    rise(".why-item", { trigger: ".why-grid", start: "top 82%", y: 36, duration: 0.6, stagger: 0.1 });

    // Final CTA
    rise(".cta-panel", { trigger: ".cta", start: "top 80%", y: 50, scale: 0.96, duration: 0.9 });
    rise(".contact-form .field, .contact-form #formSubmit", { trigger: ".contact-form", start: "top 85%", y: 20, duration: 0.5, ease: "power2.out", stagger: 0.08, delay: 0.2 });

    // Footer
    rise(".footer__brand, .footer__nav > div", { trigger: ".footer", start: "top 88%", y: 24, duration: 0.6, ease: "power2.out", stagger: 0.1 });
  }

  // Recalculate positions once everything (fonts/images) has loaded.
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
