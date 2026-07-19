const OWNER = "sci-m-wang";
const REPOSITORY = "sci-m-wang.github.io";
const BRANCH = "master";
const API_ROOT = "https://api.github.com";
const VAULT_PATH = "public/admin-vault.json";
const VAULT_AAD = "ming-wang-homepage-admin:v1";
const KDF_ITERATIONS = 650000;
const FILES = {
  publications: "src/data/publications.json",
  profile: "src/data/profile.json",
  sections: "src/data/sections.json",
};

const today = new Date().toISOString().slice(0, 10);
const state = {
  token: "",
  user: null,
  documents: { publications: null, profile: null, sections: null },
  shas: { publications: "", profile: "", sections: "" },
  section: "publications",
  currentIndex: null,
  creating: false,
  search: "",
  vault: null,
  vaultSha: "",
  dirty: false,
  formBaseline: "",
};

const byId = (id) => document.getElementById(id);
const authPanel = byId("auth-panel");
const loginForm = byId("login-form");
const setupForm = byId("setup-form");
const passwordInput = byId("vault-password");
const unlockButton = byId("unlock-button");
const setupTokenInput = byId("setup-token");
const setupPasswordInput = byId("setup-password");
const setupPasswordConfirmInput = byId("setup-password-confirm");
const setupButton = byId("setup-button");
const authKicker = byId("auth-kicker");
const authTitle = byId("auth-title");
const authCopyEn = byId("auth-copy-en");
const authCopyZh = byId("auth-copy-zh");
const vaultStatus = byId("vault-status");
const editorPanel = byId("editor-panel");
const alertBox = byId("portal-alert");
const accountName = byId("account-name");
const logoutButton = byId("logout-button");
const searchInput = byId("entry-search");
const newEntryButton = byId("new-entry-button");
const entryList = byId("entry-list");
const emptyState = byId("empty-state");
const contentForm = byId("content-form");
const formFields = byId("form-fields");
const formMode = byId("form-mode");
const formTitle = byId("form-title");
const commitMessage = byId("commit-message");
const savePath = byId("save-path");
const formFeedback = byId("form-feedback");
const saveButton = byId("save-button");
const cancelEditButton = byId("cancel-edit-button");
const dirtyStatus = byId("dirty-status");
const publishProgress = byId("publish-progress");
const publishTitle = byId("publish-title");
const publishCopy = byId("publish-copy");
const publishLink = byId("publish-link");
const saveDialog = byId("save-dialog");
const saveDialogSummary = byId("save-dialog-summary");
const saveDialogChanges = byId("save-dialog-changes");
const changePasswordButton = byId("change-password-button");
const passwordDialog = byId("password-dialog");
const passwordForm = byId("password-form");
const currentPasswordInput = byId("current-password");
const newPasswordInput = byId("new-password");
const newPasswordConfirmInput = byId("new-password-confirm");
const passwordFeedback = byId("password-feedback");
const passwordSaveButton = byId("password-save-button");
const passwordCancelButton = byId("password-cancel-button");

const sectionConfigs = {
  publications: {
    label: "论文 / Publication",
    plural: "论文",
    document: "publications",
    collection: null,
    addLabel: "新增论文",
    searchable: true,
    fields: [
      { key: "id", label: "稳定 ID", hint: "小写英文、数字与连字符", required: true, wide: false },
      { key: "year", label: "年份", type: "number", required: true, min: 2000, max: 2100 },
      { key: "title", label: "论文标题", required: true, wide: true },
      { key: "authors", label: "作者", required: true, wide: true },
      { key: "venue", label: "完整会议 / 期刊名称", required: true, wide: true },
      { key: "venueShort", label: "短名称", hint: "例如 ACL 2026", required: true },
      {
        key: "category",
        label: "作者类型",
        type: "select",
        required: true,
        options: [
          ["first", "First author"],
          ["cofirst", "Co-first author"],
          ["coauthor", "Co-author"],
          ["working", "Working paper"],
        ],
      },
      {
        key: "status",
        label: "论文状态",
        type: "select",
        required: true,
        options: [
          ["published", "Published"],
          ["preprint", "Preprint / Working paper"],
          ["accepted", "Accepted"],
        ],
      },
      { key: "pinned", label: "Pin / 置顶到论文页醒目区域与主页精选区", type: "checkbox", wide: true },
      { key: "badges", label: "标签", hint: "用英文逗号分隔", type: "list", wide: true },
      { key: "arxivId", label: "arXiv ID", hint: "例如 2506.00551" },
      { key: "publishedAt", label: "首次公开日期", hint: "YYYY-MM-DD" },
      { key: "doi", label: "DOI", hint: "不含 https://doi.org/" },
      { key: "primaryCategory", label: "arXiv 主分类", hint: "例如 cs.CL" },
      { key: "links.paper", label: "论文页面", type: "url", wide: true },
      { key: "links.pdf", label: "PDF 链接", type: "url", wide: true },
      { key: "links.code", label: "代码链接", type: "url", wide: true },
      { key: "abstract.en", label: "英文摘要", type: "textarea", wide: true },
      { key: "abstract.zh", label: "中文摘要（可选）", type: "textarea", wide: true },
      { key: "citations.count", label: "当前引用量", type: "number", min: 0 },
    ],
    create() {
      return {
        id: "",
        title: "",
        authors: "",
        venue: "",
        venueShort: "",
        year: new Date().getFullYear(),
        category: "first",
        status: "published",
        pinned: false,
        badges: [],
        arxivId: "",
        publishedAt: "",
        preprintUpdatedAt: "",
        doi: "",
        primaryCategory: "",
        links: { paper: "", pdf: "", code: "" },
        abstract: { en: "", zh: "" },
        citations: { count: 0, source: "Google Scholar", updatedAt: today },
      };
    },
    display(item) {
      return { title: item.title || "Untitled publication", meta: `${item.venueShort || item.status || "Publication"} · ${item.year || "—"}` };
    },
  },
  awards: {
    label: "奖项 / Award",
    plural: "奖项",
    document: "profile",
    collection: "awards",
    addLabel: "新增奖项",
    searchable: true,
    fields: [
      { key: "id", label: "稳定 ID", hint: "小写英文、数字与连字符", required: true },
      { key: "year", label: "年份", hint: "例如 2026", required: true },
      { key: "title.en", label: "英文奖项名称", required: true, wide: true },
      { key: "title.zh", label: "中文奖项名称", required: true, wide: true },
      { key: "event", label: "活动 / 颁发机构", required: true, wide: true },
      { key: "url", label: "相关链接", type: "url", wide: true },
      { key: "pinned", label: "Pin / 置顶到奖项页醒目区域", type: "checkbox", wide: true },
    ],
    create() {
      return { id: "", year: String(new Date().getFullYear()), title: { en: "", zh: "" }, event: "", url: "", pinned: false };
    },
    display(item) {
      return { title: item.title?.zh || item.title?.en || "Untitled award", meta: `${item.event || "Award"} · ${item.year || "—"}${item.pinned ? " · PINNED" : ""}` };
    },
  },
  funding: {
    label: "Funding",
    plural: "Funding",
    document: "profile",
    collection: "funding",
    addLabel: "新增 Funding",
    searchable: true,
    fields: [
      { key: "id", label: "稳定 ID", hint: "小写英文、数字与连字符", required: true },
      { key: "period", label: "项目周期", hint: "例如 2026 — Present", required: true },
      { key: "displayTitle", label: "正式项目名称", hint: "按项目正式使用的语言填写，不随页面语言切换", required: true, wide: true },
      { key: "role.en", label: "英文角色", required: true },
      { key: "role.zh", label: "中文角色", required: true },
      { key: "funder", label: "资助方", required: true, wide: true },
      { key: "amount", label: "金额", hint: "可留空，例如 S$70,000", wide: true },
    ],
    create() {
      return { id: "", role: { en: "", zh: "" }, displayTitle: "", title: { en: "", zh: "" }, funder: "", amount: "", period: "" };
    },
    display(item) {
      return { title: item.displayTitle || item.title?.zh || item.title?.en || "Untitled funding", meta: `${item.role?.zh || item.role?.en || "Funding"} · ${item.period || "—"}` };
    },
  },
  news: {
    label: "动态 / News",
    plural: "动态",
    document: "profile",
    collection: "news",
    addLabel: "新增动态",
    searchable: true,
    fields: [
      { key: "id", label: "稳定 ID", hint: "小写英文、数字与连字符", required: true },
      { key: "date", label: "日期", hint: "YYYY、YYYY.MM 或 YYYY-MM-DD", required: true },
      {
        key: "kind",
        label: "类型",
        type: "select",
        required: true,
        options: [
          ["Publication", "Publication / 论文"],
          ["Award", "Award / 获奖"],
          ["Talk", "Talk / 报告"],
          ["Media", "Media / 报道"],
          ["Project", "Project / 项目"],
          ["Other", "Other / 其他"],
        ],
      },
      { key: "title.en", label: "英文标题", required: true, wide: true },
      { key: "title.zh", label: "中文标题", required: true, wide: true },
      { key: "url", label: "相关链接", type: "url", wide: true },
    ],
    create() {
      return { id: "", date: String(new Date().getFullYear()), kind: "Publication", title: { en: "", zh: "" }, url: "" };
    },
    display(item) {
      return { title: item.title?.zh || item.title?.en || "Untitled news", meta: `${item.kind || "News"} · ${item.date || "—"}` };
    },
  },
  profile: {
    label: "主页信息 / Profile",
    plural: "主页信息",
    document: "profile",
    collection: "__profile__",
    addLabel: "",
    searchable: false,
    fields: [
      { key: "name", label: "英文姓名", required: true },
      { key: "nameZh", label: "中文姓名", required: true },
      { key: "pronunciation", label: "英文称呼 / Pronunciation" },
      { key: "email", label: "邮箱", type: "email", required: true },
      { key: "role.en", label: "英文身份", required: true, wide: true },
      { key: "role.zh", label: "中文身份", required: true, wide: true },
      { key: "headline.en", label: "英文主标题", required: true, wide: true },
      { key: "headline.zh", label: "中文主标题", required: true, wide: true },
      { key: "kicker.en", label: "英文研究方向", required: true, wide: true },
      { key: "kicker.zh", label: "中文研究方向", required: true, wide: true },
      { key: "bio.en", label: "英文简介", type: "textarea", required: true, wide: true },
      { key: "bio.zh", label: "中文简介", type: "textarea", required: true, wide: true },
      { key: "location.en", label: "英文所在地" },
      { key: "location.zh", label: "中文所在地" },
      { key: "metrics.1.value", label: "个人项目 Stars" },
      { key: "metrics.1.note.en", label: "Stars 英文说明", wide: true },
      { key: "metrics.1.note.zh", label: "Stars 中文说明", wide: true },
      { key: "metrics.2.value", label: "参与科研经费" },
      { key: "metrics.2.note.en", label: "经费英文说明", wide: true },
      { key: "metrics.2.note.zh", label: "经费中文说明", wide: true },
    ],
    create() {
      return null;
    },
    display(item) {
      return { title: `${item.nameZh} / ${item.name}`, meta: item.role?.zh || item.role?.en || "Profile" };
    },
  },
  pages: {
    label: "子页面 / Page",
    plural: "子页面",
    document: "sections",
    collection: null,
    addLabel: "新增子页面",
    searchable: true,
    fields: [
      { key: "id", label: "稳定 ID", hint: "小写英文、数字与连字符", required: true },
      { key: "slug", label: "页面地址", hint: "例如 academic-exchange，将生成 /academic-exchange/", required: true },
      { key: "nav.en", label: "导航英文名", required: true },
      { key: "nav.zh", label: "导航中文名", required: true },
      { key: "title.en", label: "页面英文标题", required: true },
      { key: "title.zh", label: "页面中文标题", required: true },
      { key: "intro.en", label: "英文页面简介", type: "textarea", required: true, wide: true },
      { key: "intro.zh", label: "中文页面简介", type: "textarea", required: true, wide: true },
      {
        key: "template",
        label: "页面模板",
        type: "select",
        required: true,
        options: [
          ["collection", "Custom collection / 自定义内容页"],
          ["research", "Research / 研究"],
          ["publications", "Publications / 论文"],
          ["experience", "Experience / 经历"],
          ["awards", "Awards / 荣誉"],
          ["news", "News / 动态"],
        ],
      },
      { key: "order", label: "导航顺序", type: "number", required: true, min: 1, max: 99 },
      { key: "visible", label: "在导航与主页显示", type: "checkbox", wide: true },
    ],
    create() {
      return {
        id: "",
        slug: "",
        nav: { en: "", zh: "" },
        title: { en: "", zh: "" },
        intro: { en: "", zh: "" },
        template: "collection",
        order: (state.documents.sections?.length || 0) + 1,
        visible: true,
        entries: [],
      };
    },
    display(item) {
      return { title: item.title?.zh || item.title?.en || "Untitled page", meta: `/${item.slug || "…"}/ · ${item.template || "collection"}` };
    },
  },
  pageEntries: {
    label: "页面条目 / Page entry",
    plural: "页面条目",
    document: "sections",
    collection: "__page_entries__",
    addLabel: "新增页面条目",
    searchable: true,
    fields: [
      {
        key: "sectionId",
        label: "所属子页面",
        type: "select",
        required: true,
        options: () => state.documents.sections
          .filter((section) => section.template === "collection")
          .map((section) => [section.id, `${section.title?.zh || section.title?.en} · /${section.slug}/`]),
      },
      { key: "id", label: "稳定 ID", hint: "小写英文、数字与连字符", required: true },
      { key: "title", label: "正式条目名称", hint: "按正式使用的语言填写，不随整页语言切换", required: true, wide: true },
      { key: "pinned", label: "Pin / 在自定义页面中置顶", type: "checkbox", wide: true },
      { key: "eyebrow", label: "条目类型 / 短标签", hint: "例如 Visiting scholar" },
      { key: "meta", label: "列表辅助信息", hint: "例如机构或 Venue", wide: true },
      { key: "period", label: "时间", hint: "例如 2026.08 — 2026.12" },
      { key: "venue", label: "机构 / Venue" },
      { key: "citations", label: "引用量（可选）", type: "number", min: 0 },
      { key: "authors", label: "作者 / 参与者", wide: true },
      { key: "summary.en", label: "英文简述", type: "textarea", wide: true },
      { key: "summary.zh", label: "中文简述", type: "textarea", wide: true },
      { key: "details.en", label: "英文详细信息", type: "textarea", wide: true },
      { key: "details.zh", label: "中文详细信息", type: "textarea", wide: true },
      { key: "links.paper", label: "全文 / 页面链接", type: "url", wide: true },
      { key: "links.pdf", label: "PDF 链接", type: "url", wide: true },
      { key: "links.code", label: "代码链接", type: "url", wide: true },
    ],
    create() {
      const target = state.documents.sections?.find((section) => section.template === "collection");
      if (!target) return null;
      return {
        sectionId: target.id,
        id: "",
        title: "",
        pinned: false,
        eyebrow: "",
        meta: "",
        period: "",
        venue: "",
        citations: 0,
        authors: "",
        summary: { en: "", zh: "" },
        details: { en: "", zh: "" },
        links: { paper: "", pdf: "", code: "" },
      };
    },
    display(item) {
      const section = state.documents.sections?.find((candidate) => candidate.id === item.sectionId);
      return { title: item.title || "Untitled entry", meta: `${section?.title?.zh || section?.title?.en || "Page"} · ${item.period || item.eyebrow || "Entry"}` };
    },
  },
};

function showAlert(message, tone = "info", link = "") {
  alertBox.replaceChildren();
  alertBox.hidden = false;
  alertBox.dataset.tone = tone;
  const text = document.createElement("span");
  text.textContent = message;
  alertBox.append(text);
  if (link) {
    const anchor = document.createElement("a");
    anchor.href = link;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";
    anchor.textContent = "查看提交 ↗";
    alertBox.append(anchor);
  }
}

function hideAlert() {
  alertBox.hidden = true;
  alertBox.replaceChildren();
}

function base64UrlEncode(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

async function deriveVaultKey(password, salt, iterations) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function validateVaultShape(vault) {
  return Boolean(
    vault
      && vault.version === 1
      && vault.cipher === "AES-256-GCM"
      && vault.kdf?.name === "PBKDF2"
      && vault.kdf?.hash === "SHA-256"
      && Number.isInteger(vault.kdf?.iterations)
      && vault.kdf.iterations >= 100000
      && typeof vault.kdf?.salt === "string"
      && typeof vault.iv === "string"
      && typeof vault.ciphertext === "string",
  );
}

async function encryptToken(token, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(password, salt, KDF_ITERATIONS);
  const payload = new TextEncoder().encode(JSON.stringify({
    kind: "github-token",
    owner: OWNER,
    repository: REPOSITORY,
    token,
    encryptedAt: new Date().toISOString(),
  }));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(VAULT_AAD) },
    key,
    payload,
  );
  return {
    version: 1,
    cipher: "AES-256-GCM",
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: KDF_ITERATIONS, salt: base64UrlEncode(salt) },
    iv: base64UrlEncode(iv),
    ciphertext: base64UrlEncode(new Uint8Array(ciphertext)),
    updatedAt: new Date().toISOString(),
  };
}

async function decryptToken(vault, password) {
  if (!validateVaultShape(vault)) throw new Error("加密保险箱格式无效。请查看提交记录或重新初始化。");
  try {
    const key = await deriveVaultKey(password, base64UrlDecode(vault.kdf.salt), vault.kdf.iterations);
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64UrlDecode(vault.iv),
        additionalData: new TextEncoder().encode(VAULT_AAD),
      },
      key,
      base64UrlDecode(vault.ciphertext),
    );
    const payload = JSON.parse(new TextDecoder().decode(plaintext));
    if (payload.kind !== "github-token" || payload.owner !== OWNER || payload.repository !== REPOSITORY || typeof payload.token !== "string") {
      throw new Error("Invalid vault payload.");
    }
    return payload.token;
  } catch {
    throw new Error("密码不正确，或保险箱内容已损坏。");
  }
}

async function githubApi(path, options = {}) {
  if (!state.token) throw new Error("请先连接 GitHub。/ Connect GitHub first.");
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${state.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.message ? ` ${payload.message}` : "";
    if (response.status === 401) throw new Error(`Token 无效或已过期。${detail}`);
    if (response.status === 403) throw new Error(`Token 没有写入权限或触发了 GitHub 限制。${detail}`);
    if (response.status === 409) throw new Error("远端文件刚刚发生变化，请重新载入后再保存。");
    const error = new Error(`GitHub 请求失败（${response.status}）。${detail}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

function decodeBase64Utf8(value) {
  const binary = atob(value.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Utf8(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function loadVault() {
  const response = await fetch(`${API_ROOT}/repos/${OWNER}/${REPOSITORY}/contents/${VAULT_PATH}?ref=${BRANCH}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("暂时无法检查加密保险箱，请稍后刷新页面。");
  const payload = await response.json();
  if (Array.isArray(payload) || !payload?.content || !payload?.sha) throw new Error("GitHub 返回了无法识别的保险箱文件。");
  const vault = JSON.parse(decodeBase64Utf8(payload.content));
  if (!validateVaultShape(vault)) throw new Error("加密保险箱格式无效。请从提交记录恢复，或删除后重新初始化。");
  state.vault = vault;
  state.vaultSha = payload.sha;
  return vault;
}

async function saveVault(vault, message, existingSha = "") {
  const body = {
    message,
    content: encodeBase64Utf8(`${JSON.stringify(vault, null, 2)}\n`),
    branch: BRANCH,
    ...(existingSha ? { sha: existingSha } : {}),
  };
  const payload = await githubApi(`/repos/${OWNER}/${REPOSITORY}/contents/${VAULT_PATH}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  state.vault = vault;
  state.vaultSha = payload.content.sha;
  return { commitUrl: payload.commit.html_url, commitSha: payload.commit.sha };
}

async function validateRepositoryAccess() {
  const [user, repository] = await Promise.all([
    githubApi("/user"),
    githubApi(`/repos/${OWNER}/${REPOSITORY}`),
  ]);
  if (user.login.toLowerCase() !== OWNER.toLowerCase()) {
    throw new Error(`当前凭证属于 ${user.login}，只有 ${OWNER} 可以进入编辑器。`);
  }
  if (!repository.permissions?.push && !repository.permissions?.admin) {
    throw new Error("该凭证没有此仓库的 Contents 写入权限。");
  }
  return user;
}

async function loadDocument(documentKey) {
  const filePath = FILES[documentKey];
  const payload = await githubApi(`/repos/${OWNER}/${REPOSITORY}/contents/${filePath}?ref=${BRANCH}`);
  if (Array.isArray(payload) || !payload?.content || !payload?.sha) throw new Error(`无法读取 ${filePath}。`);
  return { data: JSON.parse(decodeBase64Utf8(payload.content)), sha: payload.sha };
}

async function loadAllDocuments() {
  const [publications, profile, sections] = await Promise.all([
    loadDocument("publications"),
    loadDocument("profile"),
    loadDocument("sections"),
  ]);
  state.documents.publications = publications.data;
  state.documents.profile = profile.data;
  state.documents.sections = sections.data;
  state.shas.publications = publications.sha;
  state.shas.profile = profile.sha;
  state.shas.sections = sections.sha;
}

async function saveDocument(documentKey, nextDocument, message) {
  const latest = await loadDocument(documentKey);
  if (latest.sha !== state.shas[documentKey]) {
    state.documents[documentKey] = latest.data;
    state.shas[documentKey] = latest.sha;
    const conflictError = new Error("远端内容已更新，为避免覆盖，本页已载入最新版本。请重新检查后再保存。");
    conflictError.code = "CONTENT_CONFLICT";
    throw conflictError;
  }

  const filePath = FILES[documentKey];
  const payload = await githubApi(`/repos/${OWNER}/${REPOSITORY}/contents/${filePath}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: encodeBase64Utf8(`${JSON.stringify(nextDocument, null, 2)}\n`),
      sha: state.shas[documentKey],
      branch: BRANCH,
    }),
  });

  state.documents[documentKey] = nextDocument;
  state.shas[documentKey] = payload.content.sha;
  return { commitUrl: payload.commit.html_url, commitSha: payload.commit.sha };
}

function getPath(object, path) {
  return path.split(".").reduce((value, part) => (value == null ? undefined : value[part]), object);
}

function setPath(object, path, value) {
  const parts = path.split(".");
  const finalKey = parts.pop();
  let target = object;
  for (const part of parts) {
    if (target[part] == null) target[part] = /^\d+$/.test(part) ? [] : {};
    target = target[part];
  }
  target[finalKey] = value;
}

function getItems(section = state.section, documentOverride = null) {
  const config = sectionConfigs[section];
  const documentData = documentOverride ?? state.documents[config.document];
  if (config.collection === "__profile__") return [documentData];
  if (config.collection === "__page_entries__") {
    return documentData
      .filter((page) => page.template === "collection")
      .flatMap((page) => (page.entries || []).map((entry) => ({ ...entry, sectionId: page.id })));
  }
  if (!config.collection) return documentData;
  return documentData[config.collection];
}

function currentConfig() {
  return sectionConfigs[state.section];
}

function createField(field, item) {
  const label = document.createElement("label");
  label.className = `portal-field${field.wide ? " portal-field--wide" : ""}${field.type === "checkbox" ? " portal-field--checkbox" : ""}`;

  const title = document.createElement("span");
  title.textContent = field.label;
  if (field.hint) {
    const hint = document.createElement("small");
    hint.textContent = field.hint;
    title.append(" ", hint);
  }
  label.append(title);

  const value = getPath(item, field.key);
  let input;
  if (field.type === "textarea") {
    input = document.createElement("textarea");
    input.rows = 5;
    input.value = value ?? "";
  } else if (field.type === "select") {
    input = document.createElement("select");
    const options = typeof field.options === "function" ? field.options() : field.options;
    for (const [optionValue, optionLabel] of options) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionLabel;
      option.selected = optionValue === value;
      input.append(option);
    }
  } else {
    input = document.createElement("input");
    input.type = field.type === "list" ? "text" : field.type || "text";
    if (field.type === "checkbox") {
      input.checked = Boolean(value);
    } else if (field.type === "list") {
      input.value = Array.isArray(value) ? value.join(", ") : "";
    } else {
      input.value = value ?? "";
    }
    if (field.min != null) input.min = String(field.min);
    if (field.max != null) input.max = String(field.max);
  }

  input.dataset.fieldKey = field.key;
  input.dataset.fieldType = field.type || "text";
  input.required = Boolean(field.required);
  input.autocomplete = "off";
  label.append(input);
  return label;
}

function renderFields(item) {
  formFields.replaceChildren();
  for (const field of currentConfig().fields) formFields.append(createField(field, item));
}

function setDirty(dirty) {
  state.dirty = dirty;
  dirtyStatus.dataset.dirty = String(dirty);
  dirtyStatus.textContent = dirty ? "有未保存修改" : "所有修改已保存";
}

function confirmDiscard() {
  return !state.dirty || window.confirm("当前有尚未保存的修改，确定要放弃吗？");
}

function closeForm(force = false) {
  if (!force && !confirmDiscard()) return false;
  state.currentIndex = null;
  state.creating = false;
  contentForm.hidden = true;
  emptyState.hidden = false;
  setDirty(false);
  renderList();
  return true;
}

function openItem(index) {
  if (!confirmDiscard()) return;
  const item = structuredClone(getItems()[index]);
  state.currentIndex = index;
  state.creating = false;
  emptyState.hidden = true;
  contentForm.hidden = false;
  formMode.textContent = "Editing existing entry / 修改现有条目";
  formTitle.textContent = currentConfig().display(item).title;
  commitMessage.value = `content: update ${state.section} ${item.id || "profile"}`;
  savePath.textContent = `${FILES[currentConfig().document]} → ${BRANCH}`;
  formFeedback.textContent = "检查必填项后即可发布。";
  renderFields(item);
  setDirty(false);
  renderList();
  contentForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function createItem() {
  if (!confirmDiscard()) return;
  const config = currentConfig();
  if (!config.addLabel || !config.create) return;
  const item = config.create();
  if (!item) {
    showAlert("请先在“子页面 Pages”中新建一个 Custom collection 页面，再为它添加条目。", "info");
    switchSection("pages");
    return;
  }
  state.currentIndex = null;
  state.creating = true;
  emptyState.hidden = true;
  contentForm.hidden = false;
  formMode.textContent = "Creating new entry / 新增条目";
  formTitle.textContent = config.label;
  commitMessage.value = `content: add ${state.section} entry`;
  savePath.textContent = `${FILES[config.document]} → ${BRANCH}`;
  formFeedback.textContent = "新增条目会追加到当前列表，并触发主页重新部署。";
  renderFields(item);
  setDirty(false);
  renderList();
  contentForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderList() {
  const config = currentConfig();
  const items = getItems();
  const query = state.search.toLowerCase();
  entryList.replaceChildren();

  items.forEach((item, index) => {
    const display = config.display(item);
    const searchableText = `${display.title} ${display.meta}`.toLowerCase();
    if (query && !searchableText.includes(query)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = `portal-entry${!state.creating && state.currentIndex === index ? " is-active" : ""}`;
    button.setAttribute("role", "listitem");
    button.addEventListener("click", () => openItem(index));

    const indexLabel = document.createElement("span");
    indexLabel.textContent = String(index + 1).padStart(2, "0");
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = display.title;
    const meta = document.createElement("small");
    meta.textContent = display.meta;
    copy.append(title, meta);
    button.append(indexLabel, copy);
    entryList.append(button);
  });

  if (!entryList.childElementCount) {
    const empty = document.createElement("p");
    empty.className = "portal-entry-list__empty";
    empty.textContent = "没有匹配的条目。";
    entryList.append(empty);
  }
}

function switchSection(section) {
  if (section !== state.section && !confirmDiscard()) return;
  state.section = section;
  state.search = "";
  searchInput.value = "";
  state.currentIndex = null;
  state.creating = false;
  document.querySelectorAll(".portal-tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.section === section);
  });
  const config = currentConfig();
  newEntryButton.hidden = !config.addLabel;
  newEntryButton.textContent = config.addLabel ? `＋ ${config.addLabel}` : "";
  searchInput.disabled = !config.searchable;
  searchInput.placeholder = config.searchable ? "输入标题、角色或年份" : "主页信息无需搜索";
  closeForm(true);
  if (section === "profile") openItem(0);
}

function readFormItem() {
  const source = state.creating ? currentConfig().create() : structuredClone(getItems()[state.currentIndex]);
  for (const input of formFields.querySelectorAll("[data-field-key]")) {
    let value;
    if (input.dataset.fieldType === "checkbox") value = input.checked;
    else if (input.dataset.fieldType === "number") value = Number(input.value);
    else if (input.dataset.fieldType === "list") value = input.value.split(",").map((part) => part.trim()).filter(Boolean);
    else value = input.value.trim();
    setPath(source, input.dataset.fieldKey, value);
  }
  if (state.section === "publications") {
    source.citations.source = "Google Scholar";
    if (state.creating) source.citations.updatedAt = today;
  }
  return source;
}

function validateItem(item) {
  const config = currentConfig();
  for (const field of config.fields) {
    const value = getPath(item, field.key);
    if (field.required && (value == null || value === "")) throw new Error(`请填写“${field.label}”。`);
    if (field.type === "url" && value) {
      let url;
      try {
        url = new URL(value);
      } catch {
        throw new Error(`“${field.label}”不是有效链接。`);
      }
      if (!/^https?:$/.test(url.protocol)) throw new Error(`“${field.label}”必须使用 http 或 https。`);
    }
  }

  if (item.id && !/^[a-z0-9][a-z0-9-]*$/.test(item.id)) {
    throw new Error("稳定 ID 只能包含小写英文字母、数字和连字符。");
  }

  if (item.id) {
    const duplicate = getItems().some((existing, index) => existing.id === item.id && (state.creating || index !== state.currentIndex));
    if (duplicate) throw new Error(`ID “${item.id}” 已存在，请换一个。`);
  }

  if (state.section === "publications" && state.creating) {
    const duplicateTitle = getItems().some((existing) => existing.title.toLowerCase() === item.title.toLowerCase());
    if (duplicateTitle) throw new Error("已存在同名论文，请直接编辑原条目。");
  }

  if (state.section === "pages") {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(item.slug)) throw new Error("页面地址只能包含小写英文字母、数字和连字符。");
    if (["update"].includes(item.slug)) throw new Error(`页面地址 “${item.slug}” 已被系统使用。`);
    const duplicateSlug = getItems().some((existing, index) => existing.slug === item.slug && (state.creating || index !== state.currentIndex));
    if (duplicateSlug) throw new Error(`页面地址 “/${item.slug}/” 已存在。`);
  }

  if (state.section === "pageEntries") {
    const target = state.documents.sections.find((section) => section.id === item.sectionId && section.template === "collection");
    if (!target) throw new Error("请选择一个有效的自定义子页面。");
  }
}

function createNextDocument(item) {
  const config = currentConfig();
  let nextDocument = structuredClone(state.documents[config.document]);

  if (config.collection === "__profile__") {
    nextDocument = item;
  } else if (config.collection === "__page_entries__") {
    const persistedItem = structuredClone(item);
    delete persistedItem.sectionId;
    const targetPage = nextDocument.find((page) => page.id === item.sectionId && page.template === "collection");
    if (!targetPage) throw new Error("目标子页面不存在，请重新选择。");
    targetPage.entries ||= [];
    if (state.creating) {
      targetPage.entries.unshift(persistedItem);
    } else {
      const previous = getItems()[state.currentIndex];
      const previousPage = nextDocument.find((page) => page.id === previous.sectionId);
      const previousIndex = previousPage?.entries?.findIndex((entry) => entry.id === previous.id) ?? -1;
      if (previousIndex < 0) throw new Error("原条目已不存在，请重新载入编辑器。");
      previousPage.entries.splice(previousIndex, 1);
      if (previous.sectionId === item.sectionId) targetPage.entries.splice(previousIndex, 0, persistedItem);
      else targetPage.entries.unshift(persistedItem);
    }
  } else {
    const collection = config.collection ? nextDocument[config.collection] : nextDocument;
    if (state.creating) collection.unshift(item);
    else collection[state.currentIndex] = item;
  }

  return nextDocument;
}

function formatChangeValue(value) {
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "boolean") return value ? "是" : "否";
  return String(value ?? "—");
}

function collectChanges(item) {
  if (state.creating) return [{ label: "操作", before: "—", after: `新增 ${currentConfig().label}` }];
  const previous = getItems()[state.currentIndex];
  return currentConfig().fields
    .map((field) => ({
      label: field.label,
      before: formatChangeValue(getPath(previous, field.key)),
      after: formatChangeValue(getPath(item, field.key)),
    }))
    .filter((change) => change.before !== change.after);
}

function confirmPublish(item, message) {
  const changes = collectChanges(item);
  saveDialogSummary.textContent = changes.length
    ? `${state.creating ? "新增" : "修改"} ${currentConfig().label} · ${message}`
    : `条目内容没有变化，将只提交说明：${message}`;
  saveDialogChanges.replaceChildren();
  for (const change of changes.slice(0, 8)) {
    const term = document.createElement("dt");
    term.textContent = change.label;
    const description = document.createElement("dd");
    description.textContent = change.before === "—" ? change.after : `${change.before} → ${change.after}`;
    saveDialogChanges.append(term, description);
  }
  if (changes.length > 8) {
    const more = document.createElement("dd");
    more.textContent = `另有 ${changes.length - 8} 项修改`;
    saveDialogChanges.append(more);
  }
  saveDialog.returnValue = "cancel";
  saveDialog.showModal();
  return new Promise((resolve) => {
    saveDialog.addEventListener("close", () => resolve(saveDialog.returnValue === "confirm"), { once: true });
  });
}

function setPublishSteps(activeStep, failed = false) {
  const order = ["commit", "build", "live"];
  const activeIndex = order.indexOf(activeStep);
  for (const element of publishProgress.querySelectorAll("[data-publish-step]")) {
    const index = order.indexOf(element.dataset.publishStep);
    element.classList.toggle("is-complete", index < activeIndex || (!failed && index === activeIndex && activeStep === "live"));
    element.classList.toggle("is-active", index === activeIndex && !failed);
    element.classList.toggle("is-error", index === activeIndex && failed);
  }
}

function beginPublishProgress(commitUrl) {
  publishProgress.hidden = false;
  publishTitle.textContent = "修改已保存";
  publishCopy.textContent = "GitHub 正在构建新版主页，通常约需 1 分钟。";
  publishLink.href = commitUrl;
  publishLink.hidden = false;
  setPublishSteps("build");
}

async function trackDeployment(commitSha, commitUrl) {
  beginPublishProgress(commitUrl);
  for (let attempt = 0; attempt < 18; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, attempt === 0 ? 4000 : 7000));
    try {
      const response = await fetch(
        `${API_ROOT}/repos/${OWNER}/${REPOSITORY}/actions/runs?head_sha=${commitSha}&per_page=10`,
        { headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }, cache: "no-store" },
      );
      if (!response.ok) continue;
      const payload = await response.json();
      const run = payload.workflow_runs?.find((candidate) => candidate.name === "Deploy academic homepage") || payload.workflow_runs?.[0];
      if (!run) continue;
      publishLink.href = run.html_url || commitUrl;
      if (run.status !== "completed") {
        publishTitle.textContent = "正在部署主页";
        publishCopy.textContent = "内容已提交，GitHub 正在运行构建。";
        setPublishSteps("build");
        continue;
      }
      if (run.conclusion === "success") {
        publishTitle.textContent = "主页已更新";
        publishCopy.textContent = "新版内容已经上线，可以打开主页检查。";
        publishLink.href = "/";
        publishLink.textContent = "查看主页 ↗";
        setPublishSteps("live");
      } else {
        publishTitle.textContent = "部署没有完成";
        publishCopy.textContent = "内容已经保存，但构建需要检查。";
        setPublishSteps("build", true);
      }
      return;
    } catch {
      // Keep polling; a temporary status failure should not affect the saved commit.
    }
  }
  publishTitle.textContent = "内容已保存";
  publishCopy.textContent = "部署仍在后台进行，可稍后刷新主页查看。";
}

function setAuthMode(mode) {
  const isSetup = mode === "setup";
  loginForm.hidden = isSetup;
  setupForm.hidden = !isSetup;
  vaultStatus.textContent = isSetup ? "尚未初始化" : "保险箱已加密";
  vaultStatus.dataset.ready = String(!isSetup);
  authKicker.textContent = isSetup ? "01 · First-time setup / 首次设置" : "01 · Unlock / 解锁";
  authTitle.textContent = isSetup ? "Create your private key." : "Welcome back.";
  authCopyEn.textContent = isSetup
    ? "One short setup now; password-only access from the next visit."
    : "Enter your homepage password. Decryption happens locally in this browser.";
  authCopyZh.textContent = isSetup
    ? "只需完成一次初始化，以后进入本页只输入固定密码。"
    : "输入主页管理密码即可进入。解密只发生在当前浏览器中。";
  window.setTimeout(() => (isSetup ? setupTokenInput : passwordInput).focus(), 0);
}

function renderAccount(user) {
  accountName.textContent = user.login;
  const avatar = document.querySelector(".portal-account__avatar");
  if (avatar && user.avatar_url) {
    const image = document.createElement("img");
    image.src = user.avatar_url;
    image.alt = "";
    image.referrerPolicy = "no-referrer";
    avatar.replaceChildren(image);
  }
}

async function enterEditor(user, message) {
  await loadAllDocuments();
  state.user = user;
  renderAccount(user);
  authPanel.hidden = true;
  editorPanel.hidden = false;
  setDirty(false);
  showAlert(message, "success");
  switchSection("publications");
}

async function initializeAuth() {
  vaultStatus.textContent = "正在检查保险箱…";
  try {
    const vault = await loadVault();
    setAuthMode(vault ? "login" : "setup");
  } catch (error) {
    vaultStatus.textContent = "暂时不可用";
    showAlert(error.message || "无法检查保险箱。", "error");
  }
}

async function unlock(event) {
  event.preventDefault();
  hideAlert();
  const password = passwordInput.value;
  if (!password || !state.vault) return;
  unlockButton.disabled = true;
  unlockButton.textContent = "正在本地解密…";
  try {
    state.token = await decryptToken(state.vault, password);
    const user = await validateRepositoryAccess();
    passwordInput.value = "";
    await enterEditor(user, "保险箱已解锁。现在可以直接编辑并发布。");
  } catch (error) {
    state.token = "";
    showAlert(error.message || "无法解锁编辑器。", "error");
    passwordInput.select();
  } finally {
    unlockButton.disabled = false;
    unlockButton.textContent = "解锁编辑器";
  }
}

async function setupVault(event) {
  event.preventDefault();
  hideAlert();
  const token = setupTokenInput.value.trim();
  const password = setupPasswordInput.value;
  const confirmation = setupPasswordConfirmInput.value;
  if (password.length < 8) return showAlert("管理密码至少需要 8 个字符。", "error");
  if (password !== confirmation) return showAlert("两次输入的密码不一致。", "error");
  setupButton.disabled = true;
  setupButton.textContent = "正在验证并加密…";
  state.token = token;
  try {
    const user = await validateRepositoryAccess();
    try {
      await githubApi(`/repos/${OWNER}/${REPOSITORY}/contents/${VAULT_PATH}?ref=${BRANCH}`);
      throw new Error("保险箱已经初始化，请刷新页面后直接输入密码。");
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    const vault = await encryptToken(token, password);
    const commit = await saveVault(vault, "security: initialize encrypted homepage editor");
    setupTokenInput.value = "";
    setupPasswordInput.value = "";
    setupPasswordConfirmInput.value = "";
    await enterEditor(user, "初始化完成。以后进入本页只需要输入管理密码。");
    void trackDeployment(commit.commitSha, commit.commitUrl);
  } catch (error) {
    state.token = "";
    showAlert(error.message || "无法完成初始化。", "error");
  } finally {
    setupButton.disabled = false;
    setupButton.textContent = "加密并启用编辑器";
  }
}

function logout() {
  if (!confirmDiscard()) return;
  state.token = "";
  state.user = null;
  state.documents = { publications: null, profile: null, sections: null };
  state.shas = { publications: "", profile: "", sections: "" };
  state.currentIndex = null;
  state.creating = false;
  setDirty(false);
  passwordInput.value = "";
  contentForm.reset();
  contentForm.hidden = true;
  emptyState.hidden = false;
  editorPanel.hidden = true;
  authPanel.hidden = false;
  setAuthMode("login");
  showAlert("编辑器已锁定，解密后的凭证已从页面内存清除。", "info");
}

async function changePassword(event) {
  event.preventDefault();
  passwordFeedback.textContent = "";
  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;
  if (newPassword.length < 8) return (passwordFeedback.textContent = "新密码至少需要 8 个字符。");
  if (newPassword !== newPasswordConfirmInput.value) return (passwordFeedback.textContent = "两次输入的新密码不一致。");
  passwordSaveButton.disabled = true;
  passwordSaveButton.textContent = "正在重新加密…";
  try {
    await loadVault();
    const decrypted = await decryptToken(state.vault, currentPassword);
    if (decrypted !== state.token) throw new Error("当前密码不正确。");
    const nextVault = await encryptToken(state.token, newPassword);
    const commit = await saveVault(nextVault, "security: change homepage editor password", state.vaultSha);
    passwordForm.reset();
    passwordDialog.close();
    showAlert("管理密码已修改。下次请使用新密码解锁。", "success", commit.commitUrl);
    void trackDeployment(commit.commitSha, commit.commitUrl);
  } catch (error) {
    passwordFeedback.textContent = error.message || "密码修改失败，请稍后重试。";
  } finally {
    passwordSaveButton.disabled = false;
    passwordSaveButton.textContent = "重新加密并保存";
  }
}

async function submitContent(event) {
  event.preventDefault();
  try {
    const item = readFormItem();
    validateItem(item);
    const message = commitMessage.value.trim();
    if (!message) throw new Error("请填写提交说明。");
    if (!(await confirmPublish(item, message))) return;
    hideAlert();
    saveButton.disabled = true;
    saveButton.textContent = "正在保存…";
    formFeedback.textContent = "正在检查远端版本并创建提交…";
    const nextDocument = createNextDocument(item);
    const commit = await saveDocument(currentConfig().document, nextDocument, message);
    setDirty(false);
    showAlert("保存成功。GitHub 正在重新部署主页。", "success", commit.commitUrl);
    formFeedback.textContent = "已创建提交并触发主页更新。";
    void trackDeployment(commit.commitSha, commit.commitUrl);
    renderList();
    if (state.creating) {
      const savedIndex = getItems().findIndex((candidate) => candidate.id === item.id && (state.section !== "pageEntries" || candidate.sectionId === item.sectionId));
      state.creating = false;
      state.currentIndex = savedIndex;
      if (savedIndex >= 0) openItem(savedIndex);
      else closeForm();
    } else {
      openItem(state.currentIndex);
    }
  } catch (error) {
    showAlert(error.message || "保存失败，请稍后重试。", "error");
    formFeedback.textContent = "未保存任何修改。请根据提示检查。";
    if (error.code === "CONTENT_CONFLICT") {
      const latestIndex = state.currentIndex;
      state.creating = false;
      if (latestIndex == null) closeForm();
      else openItem(latestIndex);
    } else {
      renderList();
    }
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "检查并发布";
  }
}

loginForm.addEventListener("submit", unlock);
setupForm.addEventListener("submit", setupVault);
logoutButton.addEventListener("click", logout);
newEntryButton.addEventListener("click", createItem);
cancelEditButton.addEventListener("click", () => closeForm());
contentForm.addEventListener("submit", submitContent);
contentForm.addEventListener("input", () => setDirty(true));
searchInput.addEventListener("input", () => {
  state.search = searchInput.value.trim();
  renderList();
});
document.querySelectorAll(".portal-tab").forEach((tab) => {
  tab.addEventListener("click", () => switchSection(tab.dataset.section));
});

for (const button of document.querySelectorAll("[data-password-toggle]")) {
  button.addEventListener("click", () => {
    const input = byId(button.dataset.passwordToggle);
    const reveal = input.type === "password";
    input.type = reveal ? "text" : "password";
    button.textContent = reveal ? "隐藏" : "显示";
    button.setAttribute("aria-label", reveal ? "隐藏内容" : "显示内容");
  });
}

for (const input of document.querySelectorAll('input[type="password"]')) {
  input.addEventListener("keyup", (event) => {
    const hint = input.closest(".portal-field")?.querySelector("[data-caps-hint]");
    if (hint) hint.hidden = !event.getModifierState("CapsLock");
  });
}

changePasswordButton.addEventListener("click", () => {
  passwordForm.reset();
  passwordFeedback.textContent = "";
  passwordDialog.showModal();
  currentPasswordInput.focus();
});
passwordCancelButton.addEventListener("click", () => passwordDialog.close());
passwordForm.addEventListener("submit", changePassword);

window.addEventListener("beforeunload", (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

window.addEventListener("pagehide", () => {
  state.token = "";
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted && !editorPanel.hidden) {
    setDirty(false);
    logout();
  }
});

void initializeAuth();
