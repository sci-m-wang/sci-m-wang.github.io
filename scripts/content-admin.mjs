import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicationsPath = path.join(root, "src/data/publications.json");
const profilePath = path.join(root, "src/data/profile.json");

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required input: ${name}`);
  return value;
};

const optional = (name) => process.env[name]?.trim() ?? "";

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const writeJson = async (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");

const assertUniqueId = (records, id) => {
  if (records.some((record) => record.id === id)) {
    throw new Error(`The ID "${id}" already exists. Choose a different ID or use the edit workflow.`);
  }
};

const operation = required("CONTENT_OPERATION");

if (operation === "add-publication") {
  const publications = await readJson(publicationsPath);
  const title = required("TITLE");
  const year = Number.parseInt(required("YEAR"), 10);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error("YEAR must be a four-digit year.");

  const id = optional("ID") || `${slugify(title)}-${year}`;
  assertUniqueId(publications, id);

  publications.unshift({
    id,
    title,
    authors: required("AUTHORS"),
    venue: required("VENUE"),
    venueShort: optional("VENUE_SHORT") || `${required("VENUE")} ${year}`,
    year,
    category: required("CATEGORY"),
    status: optional("STATUS") || "published",
    pinned: optional("SELECTED") === "true",
    badges: optional("BADGES")
      .split(",")
      .map((badge) => badge.trim())
      .filter(Boolean),
    arxivId: optional("ARXIV_ID"),
    links: {
      paper: optional("PAPER_URL"),
      pdf: optional("PDF_URL"),
      code: optional("CODE_URL"),
    },
    citations: {
      count: Number.parseInt(optional("CITATIONS") || "0", 10),
      source: optional("CITATION_SOURCE") || "Google Scholar",
      updatedAt: new Date().toISOString().slice(0, 10),
    },
  });
  await writeJson(publicationsPath, publications);
} else if (operation === "add-funding") {
  const profile = await readJson(profilePath);
  const displayTitle = required("DISPLAY_TITLE");
  const id = required("ID");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error("ID must contain only lowercase letters, numbers, and hyphens.");
  assertUniqueId(profile.funding, id);

  profile.funding.unshift({
    id,
    role: { en: required("ROLE_EN"), zh: required("ROLE_ZH") },
    displayTitle,
    title: { en: displayTitle, zh: displayTitle },
    funder: required("FUNDER"),
    amount: optional("AMOUNT"),
    period: required("PERIOD"),
  });
  await writeJson(profilePath, profile);
} else if (operation === "add-news") {
  const profile = await readJson(profilePath);
  const titleEn = required("TITLE_EN");
  const date = required("DATE");
  const id = optional("ID") || `${slugify(titleEn)}-${slugify(date)}`;
  assertUniqueId(profile.news, id);

  profile.news.unshift({
    id,
    date,
    kind: required("KIND"),
    displayTitle: optional("DISPLAY_TITLE"),
    source: optional("SOURCE"),
    title: { en: titleEn, zh: required("TITLE_ZH") },
    url: optional("URL"),
  });
  await writeJson(profilePath, profile);
} else if (operation === "edit") {
  const dataset = required("DATASET");
  const id = required("ID");
  let patch;
  try {
    patch = JSON.parse(required("PATCH_JSON"));
  } catch {
    throw new Error("PATCH_JSON must be a valid JSON object.");
  }
  if (!patch || Array.isArray(patch) || typeof patch !== "object") throw new Error("PATCH_JSON must be a JSON object.");
  if ("id" in patch && patch.id !== id) throw new Error("Changing an existing record ID is not allowed.");

  if (dataset === "publications") {
    const publications = await readJson(publicationsPath);
    const index = publications.findIndex((item) => item.id === id);
    if (index < 0) throw new Error(`No publication found with ID "${id}".`);
    publications[index] = { ...publications[index], ...patch, id };
    await writeJson(publicationsPath, publications);
  } else {
    const allowedDatasets = new Set(["experience", "funding", "projects", "news", "awards", "activities", "metrics", "engagements"]);
    if (!allowedDatasets.has(dataset)) throw new Error(`Unsupported dataset: ${dataset}`);
    const profile = await readJson(profilePath);
    const index = profile[dataset].findIndex((item) => item.id === id);
    if (index < 0) throw new Error(`No ${dataset} record found with ID "${id}".`);
    profile[dataset][index] = { ...profile[dataset][index], ...patch, id };
    await writeJson(profilePath, profile);
  }
} else {
  throw new Error(`Unsupported CONTENT_OPERATION: ${operation}`);
}

console.log(`Content operation completed: ${operation}`);
