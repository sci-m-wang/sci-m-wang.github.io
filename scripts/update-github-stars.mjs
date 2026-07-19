import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profilePath = path.join(root, "src/data/profile.json");
const githubUsername = "sci-m-wang";
const today = new Date().toISOString().slice(0, 10);
const dryRun = process.argv.includes("--dry-run");
const token = process.env.GITHUB_TOKEN?.trim();
const profile = JSON.parse(await readFile(profilePath, "utf8"));

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "sci-m-wang-academic-homepage",
  "X-GitHub-Api-Version": "2022-11-28",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

const compactNumber = (value) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
    .format(value)
    .replace("K", "k")
    .replace("M", "m");

function parseGitHubRepository(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) return null;
    const [owner, rawRepository] = url.pathname.split("/").filter(Boolean);
    const repository = rawRepository?.replace(/\.git$/i, "");
    if (!owner || !repository) return null;
    return { owner, repository, key: `${owner}/${repository}`.toLowerCase() };
  } catch {
    return null;
  }
}

async function github(pathname) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const detail = remaining === "0" ? " GitHub API rate limit reached." : "";
    throw new Error(`GitHub returned HTTP ${response.status} for ${pathname}.${detail}`);
  }

  return response.json();
}

async function listOwnedRepositories(username) {
  const repositories = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await github(`/users/${encodeURIComponent(username)}/repos?type=owner&sort=full_name&per_page=100&page=${page}`);
    repositories.push(...batch);
    if (batch.length < 100) break;
  }
  return repositories;
}

const projectRepositories = new Map();
for (const project of profile.projects) {
  const repository = parseGitHubRepository(project.links?.code);
  if (repository) projectRepositories.set(repository.key, repository);
}

if (projectRepositories.size === 0) throw new Error("No GitHub project links were found in profile.json.");

const [ownedRepositories, fetchedProjects] = await Promise.all([
  listOwnedRepositories(githubUsername),
  Promise.all(
    [...projectRepositories.values()].map(async (repository) => {
      const data = await github(`/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repository)}`);
      return [repository.key, data];
    }),
  ),
]);

const projectData = new Map(fetchedProjects);
for (const project of profile.projects) {
  const repository = parseGitHubRepository(project.links?.code);
  if (!repository) {
    delete project.stars;
    continue;
  }

  const data = projectData.get(repository.key);
  project.stars = {
    count: data.stargazers_count,
    source: "GitHub",
    updatedAt: today,
    repository: data.full_name,
  };
}

const personalStars = ownedRepositories
  .filter((repository) => !repository.fork)
  .reduce((sum, repository) => sum + repository.stargazers_count, 0);

const contributedStars = [...projectData.entries()]
  .filter(([key]) => !key.startsWith(`${githubUsername.toLowerCase()}/`))
  .reduce((sum, [, repository]) => sum + repository.stargazers_count, 0);

const starsMetric = profile.metrics.find((metric) => metric.id === "stars");
if (!starsMetric) throw new Error("GitHub Stars metric is missing from profile.json.");

starsMetric.value = String(personalStars);
starsMetric.note.en = `${compactNumber(contributedStars)} across contributed projects · updated ${today}`;
starsMetric.note.zh = `参与项目合计 ${compactNumber(contributedStars)} Stars · 更新于 ${today}`;

if (dryRun) {
  console.log(
    `Dry run passed: ${personalStars} Stars across repositories owned by ${githubUsername}; ${contributedStars} Stars across ${projectData.size} featured repositories (${projectData.size - [...projectData.keys()].filter((key) => key.startsWith(`${githubUsername.toLowerCase()}/`)).length} contributed repositories).`,
  );
} else {
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  console.log(
    `Updated ${profile.projects.filter((project) => project.stars).length} project Star counts, ${personalStars} personal-project Stars, and ${contributedStars} contributed-project Stars.`,
  );
}
