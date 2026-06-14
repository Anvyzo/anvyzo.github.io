/* ============================================================
   Anvyzo - main.js
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initScrollState();
    initReveal();
    initParallax();
    initForm();
    initYear();
  });

  /* ---------- Mobile nav toggle ---------- */
  function initNav() {
    const burger = document.getElementById("navBurger");
    const links = document.getElementById("navLinks");
    if (!burger || !links) return;

    burger.addEventListener("click", function () {
      const open = links.classList.toggle("open");
      burger.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });

    // close overlay when a link is clicked
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* ---------- Nav glass-on-scroll ---------- */
  function initScrollState() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const onScroll = function () {
      nav.classList.toggle("nav--scrolled", window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Orb parallax ---------- */
  function initParallax() {
    if (reduceMotion) return;
    const orbs = document.querySelectorAll(".orb");
    if (!orbs.length) return;
    let ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        const y = window.scrollY;
        orbs.forEach(function (orb, i) {
          const depth = (i + 1) * 0.04;
          orb.style.transform = "translateY(" + (y * depth) + "px)";
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Contact form ---------- */
  function initForm() {
    const form = document.getElementById("contactForm");
    const status = document.getElementById("formStatus");
    const submit = document.getElementById("formSubmit");
    if (!form) return;

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setStatus(msg, type) {
      if (!status) return;
      status.textContent = msg;
      status.className = "form-status" + (type ? " " + type : "");
    }

    function markInvalid(field, invalid) {
      if (field) field.setAttribute("aria-invalid", String(invalid));
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      setStatus("", "");

      const name = form.elements["name"];
      const email = form.elements["email"];
      const message = form.elements["message"];

      [name, email, message].forEach(function (f) { markInvalid(f, false); });

      // validation
      let firstBad = null;
      if (!name.value.trim()) { markInvalid(name, true); firstBad = firstBad || name; }
      if (!emailRe.test(email.value.trim())) { markInvalid(email, true); firstBad = firstBad || email; }
      if (!message.value.trim()) { markInvalid(message, true); firstBad = firstBad || message; }

      if (firstBad) {
        setStatus("Please fill in the highlighted fields with a valid email.", "error");
        firstBad.focus();
        return;
      }

      // honeypot - silently succeed for bots
      if (form.elements["_gotcha"] && form.elements["_gotcha"].value) {
        setStatus("Thanks, we'll be in touch.", "success");
        form.reset();
        return;
      }

      // guard: endpoint not configured yet
      if (form.action.indexOf("your-id") !== -1) {
        setStatus("Form endpoint not configured yet. Email us at hello@anvyzo.com.", "error");
        return;
      }

      submit.disabled = true;
      const original = submit.textContent;
      submit.textContent = "Sending…";

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });
        if (res.ok) {
          setStatus("Thanks! Your message is on its way. We'll reply personally.", "success");
          form.reset();
        } else {
          setStatus("Something went wrong. Please email hello@anvyzo.com directly.", "error");
        }
      } catch (err) {
        setStatus("Network error. Please email hello@anvyzo.com directly.", "error");
      } finally {
        submit.disabled = false;
        submit.textContent = original;
      }
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }
})();
