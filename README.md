# Anvyzo Website

A stunning, single-page static website for **Anvyzo**, a Canada-based premium software
engineering, cloud, DevOps, data engineering, and AI automation studio serving businesses
across North America, the UK, and Australia.

Dark, cinematic theme with aurora glow gradients, glass cards, animated background grid,
floating orbs, and scroll-reveal motion. Zero build step, zero dependencies.

## Structure

```
index.html              # All markup (11 sections + nav + footer)
assets/css/styles.css   # Design tokens, components, animations, responsive, reduced-motion
assets/js/main.js       # Nav, scroll-reveal, parallax, contact form, footer year
assets/favicon.svg      # Aurora gradient "A" mark
```

## Local preview

No build needed. From the project root:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source = Deploy from a branch**.
4. Choose your branch (e.g. `main`) and folder **`/ (root)`**, then **Save**.
5. Your site goes live at `https://<username>.github.io/<repo>/` in a minute or two.

Because the site is plain static files, no Actions workflow or build is required.

## Configure the contact form

The contact form posts to [Formspree](https://formspree.io) (free tier available).

1. Create a free Formspree account and a new form.
2. Copy your form endpoint, e.g. `https://formspree.io/f/abcdwxyz`.
3. In `index.html`, replace the placeholder in the form `action`:

   ```html
   <form ... action="https://formspree.io/f/your-id" method="POST" ...>
   ```

   with your real endpoint.

Until configured, the form shows a friendly message pointing visitors to email instead.
Validation, the honeypot anti-spam field, and graceful success/error states all work
without any backend. The form also degrades to a normal POST if JavaScript is disabled.

## Customization quick-reference

- **Colors / brand:** edit the `:root` CSS custom properties at the top of `styles.css`
  (`--violet`, `--cyan`, `--teal` drive the aurora gradient).
- **Contact email:** search for `hello@anvyzo.com` in `index.html` and update.
- **Copy:** all text lives directly in `index.html`.
- **SEO / domain:** the canonical URL, Open Graph / Twitter tags, JSON-LD, `robots.txt`,
  and `sitemap.xml` assume the domain `https://anvyzo.com`. If you deploy elsewhere,
  search-and-replace that URL across `index.html`, `robots.txt`, and `sitemap.xml`.
  The social share image is `assets/og-image.png` (1200×630).
