# Anvyzo

Marketing site for Anvyzo, a Canada-based studio doing software engineering, cloud, DevOps, data engineering, and AI automation for clients in North America, the UK, and Australia.

Single static page. No build step, no framework, no dependencies to install. Served by GitHub Pages at anvyzo.com.

## Files

```
index.html              Markup: nav, page sections, footer.
assets/css/styles.css   Design tokens, components, animation, responsive and reduced-motion rules.
assets/js/
  main.js               Nav, contact form (validation, submit, honeypot), footer year.
  scroll.js             Lenis smooth scroll + GSAP/ScrollTrigger choreography.
  hero-network.js       Canvas node network behind the hero. Mouse-reactive, pauses off-screen.
  architecture.js       AWS diagram that assembles on scroll, with data pulses along the edges.
  terraform.js          Hover a diagram component to reveal the Terraform that provisions it.
assets/aws/             Service icons used in the diagram.
assets/favicon.svg      Favicon.
assets/og-image.png     Social share image (1200x630).
```

The animation scripts (Lenis, GSAP) load from CDNs and are additive: if a CDN is blocked or the browser prefers reduced motion, the scripts early-return and the page still renders fully.

## Run locally

Serve the folder over HTTP. Opening `index.html` directly over `file://` breaks the fetch and asset paths.

```
python3 -m http.server 8000   # then open http://localhost:8000
```

## Contact form

The form posts to [Web3Forms](https://web3forms.com), so there is no backend to run. The access key lives in the hidden `access_key` input in `index.html`; client-side keys are public by design and safe to commit, and Web3Forms gates abuse behind its own domain and bot checks. Submissions are delivered by email.

If the key is missing or still the `YOUR_ACCESS_KEY` placeholder, the form falls back to a message asking visitors to email instead. With JavaScript off, it degrades to a plain POST.

## Deploy

GitHub Pages serves the repo root; pushing to `main` publishes. The custom domain comes from the `CNAME` file plus the DNS records at the registrar.

## Editing

- Brand colors: the `:root` custom properties at the top of `styles.css` (`--violet`, `--cyan`, `--teal` drive the gradient).
- Copy: all text is in `index.html`.
- Contact address: search `index.html` for `hello@anvyzo.com`.
- Domain and SEO: the canonical URL, Open Graph and Twitter tags, JSON-LD, `robots.txt`, and `sitemap.xml` all use `anvyzo.com`. Change them together if the domain changes.
