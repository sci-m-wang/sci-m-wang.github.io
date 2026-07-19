# Ming Wang · Academic Homepage

A from-scratch academic homepage for [sci-m-wang.github.io](https://sci-m-wang.github.io), designed as a living research archive rather than a theme-based CV.

这是为 [sci-m-wang.github.io](https://sci-m-wang.github.io) 从零构建的学术主页。它采用结构化数据驱动，便于维护论文、Funding、动态、报告与荣誉信息。

## What is included

- Responsive bilingual interface (English / 中文)
- Restrained academic visual system with accessible, reduced-motion-aware interaction
- Filterable publication archive with per-paper citation counts
- Weekly citation refresh through GitHub Actions
- GitHub Pages deployment workflow
- Browser-based owner editor for publications, funding, news, profile information, subpages, and custom page entries
- SEO metadata, sitemap, JSON-LD person profile, and a custom Open Graph card

## Local development

Requirements: Node.js 22.12 or newer.

```bash
npm install
npm run dev
```

Create a production build:

```bash
npm run build
```

## Content structure

The site intentionally keeps content separate from layout code:

- `src/data/profile.json` — biography, metrics, research areas, education, funding, awards, talks, service, and news
- `src/data/publications.json` — publication metadata, links, categories, and citation counts
- `src/data/sections.json` — the subpage registry, navigation order, page introductions, templates, and custom page entries
- `public/cv/` — downloadable CV files
- `public/profile.jpg` — profile portrait

Stable `id` fields are used by the protected edit workflow. Do not rename an existing ID unless all references are updated.

The language switch controls interface and narrative copy. Formal records keep their official wording: publication titles are stored as one `title`, and funding records use one `displayTitle`, so these names do not change with the site language.

## Protected browser editor

The public `/update/` route contains a direct, browser-based editor for:

1. Adding and editing publications
2. Adding and editing funding records
3. Adding and editing news or media coverage
4. Editing core profile copy and selected metrics
5. Adding or editing subpages without changing layout code
6. Adding expandable entries to any custom collection page

New pages created with the `Custom collection` template automatically receive a route at `/<slug>/`, a homepage directory card, and a navigation item. Setting a page to hidden removes it from navigation and the homepage while keeping its URL buildable. Formal entry names are stored once and remain fixed across language modes; bilingual fields are reserved for interface copy, descriptions, and narrative details.

The editor uses a small client-side encrypted vault. During one-time setup, a GitHub fine-grained personal access token restricted to this repository with only **Contents: Read and write** permission is encrypted with the chosen homepage password.

- The repository stores only PBKDF2 parameters and AES-256-GCM ciphertext in `public/admin-vault.json`; the password is not stored.
- On later visits, the password decrypts the token locally. The plaintext token is held only in page memory and is cleared on refresh, navigation, lock, or logout.
- GitHub verifies the decrypted token, repository owner, and write permission before the editor opens.
- The unlocked editor includes a change-password action that re-encrypts the same token and commits a new vault ciphertext.
- Each save performs a remote SHA check to prevent overwriting a newer version, then creates one traceable commit on `master`.
- Content Security Policy restricts editor network requests to the site itself and `api.github.com`.
- The owner-only GitHub Actions forms remain available in the repository as a fallback maintenance path.

Because the encrypted vault is stored in a public repository, the password should not be reused for other accounts. Revoke the fine-grained token from GitHub settings if the password may have leaked.

## Citation updates

`.github/workflows/citations.yml` runs every Monday and can also be triggered manually.

- The workflow reads the public Google Scholar profile directly, so no API key or repository secret is required.
- Requests are limited to once a week, with conservative retries and a normal browser user agent.
- If Google Scholar returns a CAPTCHA, rate limit, incomplete page, or too few title matches, the script stops before saving; the last verified counts remain intact.
- Google Scholar may occasionally block requests from GitHub-hosted runners. In that case, rerun the workflow later or update counts manually.

Publication abstracts and related metadata can be refreshed from arXiv with `npm run publications:metadata`. Existing manually entered abstracts are preserved, while missing abstracts, publication dates, DOI values, and primary arXiv categories are filled from the public arXiv record.

## GitHub Pages

The deploy workflow builds the static Astro site and publishes `dist/` with GitHub's official Pages actions. In repository settings, set **Pages → Source** to **GitHub Actions**.

## Design references

The information architecture was informed by common strengths of [al-folio](https://github.com/alshedivat/al-folio), [Academic Pages](https://github.com/academicpages/academicpages.github.io), and [Hugo Academic CV](https://github.com/HugoBlox/hugo-theme-academic-cv), while the code and visual system were rebuilt independently for this site.

## License

MIT © Ming Wang
