# Ming Wang · Academic Homepage

A from-scratch academic homepage for [sci-m-wang.github.io](https://sci-m-wang.github.io), designed as a living research archive rather than a theme-based CV.

这是为 [sci-m-wang.github.io](https://sci-m-wang.github.io) 从零构建的学术主页。它采用结构化数据驱动，便于维护论文、Funding、动态、报告与荣誉信息。

## What is included

- Responsive bilingual interface (English / 中文)
- Editorial academic visual system with accessible, reduced-motion-aware interaction
- Filterable publication archive with per-paper citation counts
- Weekly citation refresh through GitHub Actions
- GitHub Pages deployment workflow
- Authenticated owner-only update workflows for publications, funding, news, and corrections
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
- `public/cv/` — downloadable CV files
- `public/profile.jpg` — profile portrait

Stable `id` fields are used by the protected edit workflow. Do not rename an existing ID unless all references are updated.

## Protected update entrance

The public `/update/` page links to four structured GitHub Actions forms:

1. Add a publication
2. Add funding
3. Add news or media coverage
4. Correct an existing entry

Security is handled entirely by GitHub:

- GitHub authentication and repository permissions are required to run a workflow.
- Every content workflow additionally checks `github.actor == github.repository_owner`.
- No password, token, API key, or editable admin state is stored in the public website.
- Successful updates modify the JSON data, create a Git commit, and trigger a fresh Pages deployment.

## Citation updates

`.github/workflows/citations.yml` runs every Monday and can also be triggered manually.

- The workflow reads the public Google Scholar profile directly, so no API key or repository secret is required.
- Requests are limited to once a week, with conservative retries and a normal browser user agent.
- If Google Scholar returns a CAPTCHA, rate limit, incomplete page, or too few title matches, the script stops before saving; the last verified counts remain intact.
- Google Scholar may occasionally block requests from GitHub-hosted runners. In that case, rerun the workflow later or update counts manually.

## GitHub Pages

The deploy workflow builds the static Astro site and publishes `dist/` with GitHub's official Pages actions. In repository settings, set **Pages → Source** to **GitHub Actions**.

## Design references

The information architecture was informed by common strengths of [al-folio](https://github.com/alshedivat/al-folio), [Academic Pages](https://github.com/academicpages/academicpages.github.io), and [Hugo Academic CV](https://github.com/HugoBlox/hugo-theme-academic-cv), while the code and visual system were rebuilt independently for this site.

## License

MIT © Ming Wang
