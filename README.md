# Ming Wang · Academic Homepage

A from-scratch academic homepage for [sci-m-wang.github.io](https://sci-m-wang.github.io), designed as a living research archive rather than a theme-based CV.

这是为 [sci-m-wang.github.io](https://sci-m-wang.github.io) 从零构建的学术主页。它采用结构化数据驱动，便于维护论文、项目、经历、奖项、报告服务、动态与媒体报道。

## What is included

- Responsive bilingual interface (English / 中文)
- Restrained academic visual system with accessible, reduced-motion-aware interaction
- Filterable publication archive with per-paper citation counts, detail dialogs, and pinned work
- Dedicated awards archive with a pinned recognition area
- Dedicated Funding & Projects, Experience, Talks & Service, and News & Media pages
- Compact research-focus list and current Singapore base on the homepage
- Weekly Google Scholar citation and GitHub Stars refresh through GitHub Actions
- GitHub Pages deployment workflow
- Browser-based owner editor for publications, experience, funding, projects, awards, talks and service, news and media, profile information, subpages, and custom page entries
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

- `src/data/profile.json` — biography, metrics, research areas, experience, funding, projects, awards, talks, service, volunteering, news, and media coverage
- `src/data/publications.json` — publication metadata, links, categories, and citation counts
- `src/data/sections.json` — the subpage registry, navigation order, page introductions, templates, and custom page entries
- `public/cv/` — downloadable CV files
- `public/profile.jpg` — profile portrait

Stable `id` fields are used by the protected edit workflow. Do not rename an existing ID unless all references are updated.

The language switch controls interface and narrative copy. Formal records keep their official wording: publication titles are stored as one `title`, and funding records use one `displayTitle`, so these names do not change with the site language.

## Protected browser editor

The public `/update/` route contains a direct, browser-based editor for:

1. Adding and editing publications
2. Adding and editing education, formal work, exchange, or internship records
3. Adding and editing funding records and research projects
4. Adding and editing awards
5. Adding and editing talks, academic service, outreach, or volunteering
6. Adding and editing news or media coverage
7. Editing core profile copy, research-focus labels, location, and selected metrics
8. Adding or editing subpages without changing layout code
9. Adding expandable entries to any custom collection page

Publications, projects, awards, and custom collection entries can be marked as `pinned` in the editor. Pinned publications appear in the homepage highlights and at the top of the publication archive; pinned projects and awards appear first in their own archives.

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

## GitHub Stars updates

`.github/workflows/stars.yml` runs every Monday and can also be triggered manually. It uses GitHub's built-in workflow token, so no API key or repository secret is required.

- The homepage metric sums Stars across public, non-fork repositories owned by `sci-m-wang`.
- Each featured project with a GitHub code link receives its own current Star count.
- The metric note scans the public GitHub contribution graph year by year and deduplicates external repositories. It counts repositories with default-branch commits, merged pull requests, or an explicit featured-project record, while excluding unmerged PR-only activity from the Star total.

Publication abstracts and related metadata can be refreshed from arXiv with `npm run publications:metadata`. Existing manually entered abstracts are preserved, while missing abstracts, publication dates, DOI values, and primary arXiv categories are filled from the public arXiv record.

## GitHub Pages

The deploy workflow builds the static Astro site and publishes `dist/` with GitHub's official Pages actions. In repository settings, set **Pages → Source** to **GitHub Actions**.

## Design references

The information architecture was informed by common strengths of [al-folio](https://github.com/alshedivat/al-folio), [Academic Pages](https://github.com/academicpages/academicpages.github.io), and [Hugo Academic CV](https://github.com/HugoBlox/hugo-theme-academic-cv), while the code and visual system were rebuilt independently for this site.

## License

MIT © Ming Wang
