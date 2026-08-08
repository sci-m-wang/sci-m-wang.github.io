import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicationsPath = path.join(root, "src/data/publications.json");
const citationsPath = path.join(root, "src/data/citations.json");
const scholarAuthorId = "dcqk_mMAAAAJ";
const updatedAt = new Date().toISOString();
const dryRun = process.argv.includes("--dry-run");

const scholarUrl = new URL("https://scholar.google.com/citations");
scholarUrl.searchParams.set("user", scholarAuthorId);
scholarUrl.searchParams.set("hl", "en");
scholarUrl.searchParams.set("oi", "ao");
scholarUrl.searchParams.set("view_op", "list_works");
scholarUrl.searchParams.set("sortby", "pubdate");
scholarUrl.searchParams.set("pagesize", "100");

const publications = JSON.parse(await readFile(publicationsPath, "utf8"));

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const decodeHtml = (value) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&(amp|quot|apos|lt|gt|nbsp|#39);/gi, (entity) => {
      const entities = {
        "&amp;": "&",
        "&quot;": '"',
        "&apos;": "'",
        "&lt;": "<",
        "&gt;": ">",
        "&nbsp;": " ",
        "&#39;": "'",
      };
      return entities[entity.toLowerCase()] ?? entity;
    });

const plainText = (value) =>
  decodeHtml(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const normalize = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const parseNumber = (value) => {
  const digits = plainText(value).replace(/[^0-9]/g, "");
  return digits ? Number.parseInt(digits, 10) : 0;
};

function parseScholarProfile(html) {
  if (/not a robot|unusual traffic|recaptcha/i.test(html)) {
    throw new Error("Google Scholar requested a CAPTCHA; the existing citation data was left unchanged.");
  }

  const metricsTable = html.match(/<table[^>]*id="gsc_rsb_st"[^>]*>([\s\S]*?)<\/table>/i)?.[1];
  if (!metricsTable) throw new Error("Google Scholar metrics table was not found.");

  const metrics = [...metricsTable.matchAll(/<td[^>]*class="[^"]*\bgsc_rsb_std\b[^"]*"[^>]*>([\s\S]*?)<\/td>/gi)].map(
    (match) => parseNumber(match[1]),
  );
  if (metrics.length < 5) throw new Error("Google Scholar returned incomplete profile metrics.");

  const articles = [];
  const rows = html.matchAll(/<tr[^>]*class="[^"]*\bgsc_a_tr\b[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const row of rows) {
    const titleHtml = row[1].match(/<a[^>]*class="[^"]*\bgsc_a_at\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1];
    if (!titleHtml) continue;
    const citationHtml = row[1].match(/<a[^>]*class="[^"]*\bgsc_a_ac\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? "";
    articles.push({ title: plainText(titleHtml), citations: parseNumber(citationHtml) });
  }

  if (articles.length < 10) {
    throw new Error(`Google Scholar returned only ${articles.length} publications; refusing to overwrite verified data.`);
  }

  return {
    totalCitations: metrics[0],
    hIndex: metrics[2],
    i10Index: metrics[4],
    articles,
  };
}

async function fetchScholarProfile() {
  const attempts = 3;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(scholarUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) throw new Error(`Google Scholar returned HTTP ${response.status}.`);
      return parseScholarProfile(await response.text());
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(attempt * 12_000);
    }
  }

  throw lastError;
}

function buildSnapshot(data) {
  const articleByTitle = new Map(data.articles.map((article) => [normalize(article.title), article]));
  const matched = publications.filter((publication) => articleByTitle.has(normalize(publication.title))).length;

  if (matched < 10) {
    throw new Error(`Only ${matched} homepage publications matched Google Scholar; refusing to save partial data.`);
  }

  return {
    snapshot: {
      schemaVersion: 1,
      source: "Google Scholar",
      authorId: scholarAuthorId,
      updatedAt,
      totalCitations: data.totalCitations,
      hIndex: data.hIndex,
      i10Index: data.i10Index,
      papers: data.articles.map((article) => ({
        id: normalize(article.title),
        title: article.title,
        citations: article.citations,
        url: `https://scholar.google.com/citations?user=${scholarAuthorId}`,
      })),
    },
    matched,
  };
}

const scholarData = await fetchScholarProfile();
const { snapshot, matched } = buildSnapshot(scholarData);

if (dryRun) {
  console.log(
    `Dry run passed: ${scholarData.totalCitations} total citations, h-index ${scholarData.hIndex}, ${matched}/${publications.length} homepage publications matched.`,
  );
} else {
  await writeFile(citationsPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(
    `Updated the citation snapshot with ${scholarData.articles.length} Scholar papers; ${matched}/${publications.length} homepage publications matched (${scholarData.totalCitations} total citations).`,
  );
}
