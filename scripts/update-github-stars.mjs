import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profilePath = path.join(root, "src/data/profile.json");
const githubUsername = "sci-m-wang";
const contributionStartYear = 2018;
const now = new Date();
const today = now.toISOString().slice(0, 10);
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

async function github(pathname, options = {}) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers,
    ...options,
    headers: { ...headers, ...options.headers },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    const detail = remaining === "0" ? " GitHub API rate limit reached." : "";
    throw new Error(`GitHub returned HTTP ${response.status} for ${pathname}.${detail}`);
  }

  return response.json();
}

async function discoverPublicContributions(username) {
  if (!token) return null;

  const currentYear = Number(today.slice(0, 4));
  const periods = [];
  for (let year = contributionStartYear; year <= currentYear; year += 1) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = year === currentYear ? now.toISOString() : `${year}-12-31T23:59:59Z`;
    periods.push(`
      y${year}: contributionsCollection(from: "${from}", to: "${to}") {
        commitContributionsByRepository(maxRepositories: 100) {
          repository { nameWithOwner stargazerCount owner { login } }
          contributions { totalCount }
        }
        pullRequestContributionsByRepository(maxRepositories: 100) {
          repository { nameWithOwner stargazerCount owner { login } }
          contributions { totalCount }
        }
      }
    `);
  }

  const query = `query($login: String!) { user(login: $login) { ${periods.join("\n")} } }`;
  const payload = await github("/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: username } }),
  });

  if (payload.errors?.length) throw new Error(`GitHub GraphQL error: ${payload.errors.map((error) => error.message).join("; ")}`);
  if (!payload.data?.user) throw new Error(`GitHub user ${username} was not found.`);

  const repositories = new Map();
  const addContribution = (item, type, year) => {
    const repository = item.repository;
    if (!repository || repository.owner.login.toLowerCase() === username.toLowerCase()) return;
    const key = repository.nameWithOwner.toLowerCase();
    const existing = repositories.get(key) ?? {
      repository: repository.nameWithOwner,
      owner: repository.owner.login,
      stars: repository.stargazerCount,
      commitContributions: 0,
      pullRequestContributions: 0,
      years: new Set(),
    };
    existing.repository = repository.nameWithOwner;
    existing.owner = repository.owner.login;
    existing.stars = repository.stargazerCount;
    existing[type] += item.contributions.totalCount;
    existing.years.add(year);
    repositories.set(key, existing);
  };

  for (const [period, collection] of Object.entries(payload.data.user)) {
    const year = Number(period.slice(1));
    for (const item of collection.commitContributionsByRepository) addContribution(item, "commitContributions", year);
    for (const item of collection.pullRequestContributionsByRepository) addContribution(item, "pullRequestContributions", year);
  }

  return repositories;
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

const [ownedRepositories, fetchedProjects, discoveredContributions] = await Promise.all([
  listOwnedRepositories(githubUsername),
  Promise.all(
    [...projectRepositories.values()].map(async (repository) => {
      const data = await github(`/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repository)}`);
      return [repository.key, data];
    }),
  ),
  discoverPublicContributions(githubUsername),
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

const storedContributions = new Map(
  (profile.githubContributions?.repositories ?? []).map((repository) => [
    repository.repository.toLowerCase(),
    { ...repository, years: new Set(repository.years ?? []) },
  ]),
);
const contributedRepositories = discoveredContributions ?? storedContributions;

for (const repository of projectData.values()) {
  if (repository.owner.login.toLowerCase() === githubUsername.toLowerCase()) continue;
  const key = repository.full_name.toLowerCase();
  const existing = contributedRepositories.get(key) ?? {
    repository: repository.full_name,
    owner: repository.owner.login,
    commitContributions: 0,
    pullRequestContributions: 0,
    years: new Set(),
  };
  existing.stars = repository.stargazers_count;
  contributedRepositories.set(key, existing);
}

const contributionRecords = [...contributedRepositories.values()]
  .map((repository) => ({ ...repository, years: [...repository.years].sort() }))
  .sort((a, b) => b.stars - a.stars || a.repository.localeCompare(b.repository));
const contributedStars = contributionRecords.reduce((sum, repository) => sum + repository.stars, 0);
const contributionUpdatedAt = discoveredContributions ? today : profile.githubContributions?.updatedAt ?? today;

profile.githubContributions = {
  source: "GitHub public contribution graph",
  updatedAt: contributionUpdatedAt,
  repositories: contributionRecords,
};

const starsMetric = profile.metrics.find((metric) => metric.id === "stars");
if (!starsMetric) throw new Error("GitHub Stars metric is missing from profile.json.");

starsMetric.value = String(personalStars);
starsMetric.note.en = `${compactNumber(contributedStars)} across ${contributionRecords.length} contributed repositories · updated ${contributionUpdatedAt}`;
starsMetric.note.zh = `外部贡献 ${contributionRecords.length} 个仓库 · 合计 ${compactNumber(contributedStars)} Stars · 更新于 ${contributionUpdatedAt}`;

if (dryRun) {
  console.log(
    `Dry run passed: ${personalStars} Stars across repositories owned by ${githubUsername}; ${contributedStars} Stars across ${contributionRecords.length} contributed repositories (${discoveredContributions ? "discovered from the public contribution graph" : "using the stored contribution registry"}).`,
  );
} else {
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  console.log(
    `Updated ${profile.projects.filter((project) => project.stars).length} featured project Star counts, ${personalStars} personal-project Stars, and ${contributedStars} Stars across ${contributionRecords.length} contributed repositories.`,
  );
}
