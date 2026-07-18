const OWNER = "sci-m-wang";
const REPOSITORY = "sci-m-wang.github.io";
const BRANCH = "master";
const API_ROOT = "https://api.github.com";
const FILES = {
  publications: "src/data/publications.json",
  profile: "src/data/profile.json",
};

const today = new Date().toISOString().slice(0, 10);
const state = {
  token: "",
  user: null,
  documents: { publications: null, profile: null },
  shas: { publications: "", profile: "" },
  section: "publications",
  currentIndex: null,
  creating: false,
  search: "",
};

const byId = (id) => document.getElementById(id);
const authPanel = byId("auth-panel");
const authForm = byId("auth-form");
const tokenInput = byId("github-token");
const connectButton = byId("connect-button");
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
      { key: "selected", label: "在精选论文中突出显示", type: "checkbox", wide: true },
      { key: "badges", label: "标签", hint: "用英文逗号分隔", type: "list", wide: true },
      { key: "arxivId", label: "arXiv ID", hint: "例如 2506.00551" },
      { key: "links.paper", label: "论文页面", type: "url", wide: true },
      { key: "links.pdf", label: "PDF 链接", type: "url", wide: true },
      { key: "links.code", label: "代码链接", type: "url", wide: true },
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
        selected: false,
        badges: [],
        arxivId: "",
        links: { paper: "", pdf: "", code: "" },
        citations: { count: 0, source: "Google Scholar", updatedAt: today },
      };
    },
    display(item) {
      return { title: item.title || "Untitled publication", meta: `${item.venueShort || item.status || "Publication"} · ${item.year || "—"}` };
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
      { key: "title.en", label: "英文项目名称", required: true, wide: true },
      { key: "title.zh", label: "中文项目名称", required: true, wide: true },
      { key: "role.en", label: "英文角色", required: true },
      { key: "role.zh", label: "中文角色", required: true },
      { key: "funder", label: "资助方", required: true, wide: true },
      { key: "amount", label: "金额", hint: "可留空，例如 S$70,000", wide: true },
    ],
    create() {
      return { id: "", role: { en: "", zh: "" }, title: { en: "", zh: "" }, funder: "", amount: "", period: "" };
    },
    display(item) {
      return { title: item.title?.zh || item.title?.en || "Untitled funding", meta: `${item.role?.zh || item.role?.en || "Funding"} · ${item.period || "—"}` };
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
    throw new Error(`GitHub 请求失败（${response.status}）。${detail}`);
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

async function loadDocument(documentKey) {
  const filePath = FILES[documentKey];
  const payload = await githubApi(`/repos/${OWNER}/${REPOSITORY}/contents/${filePath}?ref=${BRANCH}`);
  if (Array.isArray(payload) || !payload?.content || !payload?.sha) throw new Error(`无法读取 ${filePath}。`);
  return { data: JSON.parse(decodeBase64Utf8(payload.content)), sha: payload.sha };
}

async function loadAllDocuments() {
  const [publications, profile] = await Promise.all([loadDocument("publications"), loadDocument("profile")]);
  state.documents.publications = publications.data;
  state.documents.profile = profile.data;
  state.shas.publications = publications.sha;
  state.shas.profile = profile.sha;
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
  return payload.commit.html_url;
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
    for (const [optionValue, optionLabel] of field.options) {
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

function closeForm() {
  state.currentIndex = null;
  state.creating = false;
  contentForm.hidden = true;
  emptyState.hidden = false;
  renderList();
}

function openItem(index) {
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
  renderList();
  contentForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function createItem() {
  const config = currentConfig();
  if (!config.addLabel || !config.create) return;
  const item = config.create();
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
  closeForm();
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

  if (state.creating && item.id) {
    const duplicate = getItems().some((existing) => existing.id === item.id);
    if (duplicate) throw new Error(`ID “${item.id}” 已存在，请换一个。`);
  }

  if (state.section === "publications" && state.creating) {
    const duplicateTitle = getItems().some((existing) => existing.title.toLowerCase() === item.title.toLowerCase());
    if (duplicateTitle) throw new Error("已存在同名论文，请直接编辑原条目。");
  }
}

function createNextDocument(item) {
  const config = currentConfig();
  let nextDocument = structuredClone(state.documents[config.document]);

  if (config.collection === "__profile__") {
    nextDocument = item;
  } else {
    const collection = config.collection ? nextDocument[config.collection] : nextDocument;
    if (state.creating) collection.unshift(item);
    else collection[state.currentIndex] = item;
  }

  return nextDocument;
}

async function connect(event) {
  event.preventDefault();
  hideAlert();
  const candidateToken = tokenInput.value.trim();
  if (!candidateToken) return;

  state.token = candidateToken;
  connectButton.disabled = true;
  connectButton.textContent = "正在验证…";

  try {
    const [user, repository] = await Promise.all([
      githubApi("/user"),
      githubApi(`/repos/${OWNER}/${REPOSITORY}`),
    ]);
    if (user.login.toLowerCase() !== OWNER.toLowerCase()) {
      throw new Error(`当前 Token 属于 ${user.login}，只有 ${OWNER} 可以进入编辑器。`);
    }
    if (!repository.permissions?.push && !repository.permissions?.admin) {
      throw new Error("该 Token 没有此仓库的 Contents 写入权限。");
    }

    await loadAllDocuments();
    state.user = user;
    tokenInput.value = "";
    accountName.textContent = user.login;
    const avatar = document.querySelector(".portal-account__avatar");
    if (avatar && user.avatar_url) {
      const image = document.createElement("img");
      image.src = user.avatar_url;
      image.alt = "";
      image.referrerPolicy = "no-referrer";
      avatar.replaceChildren(image);
    }
    authPanel.hidden = true;
    editorPanel.hidden = false;
    showAlert("身份与仓库权限验证成功。现在可以直接编辑并发布。", "success");
    switchSection("publications");
  } catch (error) {
    state.token = "";
    showAlert(error.message || "无法连接 GitHub。", "error");
  } finally {
    connectButton.disabled = false;
    connectButton.textContent = "连接并打开编辑器";
  }
}

function logout() {
  state.token = "";
  state.user = null;
  state.documents = { publications: null, profile: null };
  state.shas = { publications: "", profile: "" };
  tokenInput.value = "";
  contentForm.reset();
  editorPanel.hidden = true;
  authPanel.hidden = false;
  closeForm();
  showAlert("已退出编辑，Token 已从页面内存清除。", "info");
  tokenInput.focus();
}

async function submitContent(event) {
  event.preventDefault();
  hideAlert();
  saveButton.disabled = true;
  saveButton.textContent = "正在保存…";
  formFeedback.textContent = "正在检查远端版本并创建提交…";

  try {
    const item = readFormItem();
    validateItem(item);
    const message = commitMessage.value.trim();
    if (!message) throw new Error("请填写提交说明。");
    const nextDocument = createNextDocument(item);
    const commitUrl = await saveDocument(currentConfig().document, nextDocument, message);
    showAlert("保存成功。GitHub 正在重新部署主页，通常约需 1 分钟。", "success", commitUrl);
    formFeedback.textContent = "已创建提交并触发主页更新。";
    renderList();
    if (state.creating) {
      const savedItems = getItems();
      state.creating = false;
      state.currentIndex = 0;
      openItem(0);
      if (!savedItems.length) closeForm();
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
    saveButton.textContent = "保存并发布";
  }
}

authForm.addEventListener("submit", connect);
logoutButton.addEventListener("click", logout);
newEntryButton.addEventListener("click", createItem);
cancelEditButton.addEventListener("click", closeForm);
contentForm.addEventListener("submit", submitContent);
searchInput.addEventListener("input", () => {
  state.search = searchInput.value.trim();
  renderList();
});
document.querySelectorAll(".portal-tab").forEach((tab) => {
  tab.addEventListener("click", () => switchSection(tab.dataset.section));
});

window.addEventListener("pagehide", () => {
  state.token = "";
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted && !editorPanel.hidden) logout();
});
