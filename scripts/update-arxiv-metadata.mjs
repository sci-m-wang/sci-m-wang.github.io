import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicationsPath = path.join(root, "src/data/publications.json");
const publications = JSON.parse(await readFile(publicationsPath, "utf8"));
const arxivPublications = publications.filter((publication) => publication.arxivId);

if (!arxivPublications.length) {
  console.log("No arXiv publications found.");
  process.exit(0);
}

const decodeXml = (value) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&(amp|quot|apos|lt|gt);/g, (entity) => ({
      "&amp;": "&",
      "&quot;": '"',
      "&apos;": "'",
      "&lt;": "<",
      "&gt;": ">",
    })[entity] || entity)
    .replace(/\\(?:uline|textit|textbf)\{([^}]+)\}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const textOf = (entry, tag) => {
  const match = entry.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]) : "";
};

const url = new URL("https://export.arxiv.org/api/query");
url.searchParams.set("id_list", arxivPublications.map((publication) => publication.arxivId).join(","));
url.searchParams.set("max_results", String(arxivPublications.length));

const response = await fetch(url, {
  headers: {
    Accept: "application/atom+xml",
    "User-Agent": "MingWangAcademicHomepage/1.0 (https://sci-m-wang.github.io)",
  },
  signal: AbortSignal.timeout(30_000),
});

if (!response.ok) throw new Error(`arXiv returned HTTP ${response.status}.`);
const xml = await response.text();
const metadataById = new Map();

for (const match of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
  const entry = match[1];
  const arxivId = textOf(entry, "id").match(/\/abs\/([0-9.]+)(?:v\d+)?$/)?.[1];
  if (!arxivId) continue;
  metadataById.set(arxivId, {
    abstract: textOf(entry, "summary"),
    publishedAt: textOf(entry, "published").slice(0, 10),
    preprintUpdatedAt: textOf(entry, "updated").slice(0, 10),
    doi: entry.match(/<arxiv:doi>([\s\S]*?)<\/arxiv:doi>/i)?.[1]?.trim() || "",
    primaryCategory: entry.match(/<arxiv:primary_category\s+term="([^"]+)"/i)?.[1] || "",
  });
}

if (!metadataById.size) throw new Error("arXiv returned no matching publication metadata.");

let updated = 0;
for (const publication of arxivPublications) {
  const metadata = metadataById.get(publication.arxivId);
  if (!metadata) continue;
  const existingAbstract = typeof publication.abstract === "string" ? publication.abstract : publication.abstract?.en;
  if (!existingAbstract && metadata.abstract) {
    publication.abstract = { en: metadata.abstract, zh: publication.abstract?.zh || "" };
  }
  publication.publishedAt ||= metadata.publishedAt;
  publication.preprintUpdatedAt = metadata.preprintUpdatedAt;
  publication.doi ||= metadata.doi;
  publication.primaryCategory ||= metadata.primaryCategory;
  updated += 1;
}

await writeFile(publicationsPath, `${JSON.stringify(publications, null, 2)}\n`, "utf8");
console.log(`Updated arXiv metadata for ${updated}/${arxivPublications.length} publications.`);
