import { findDuplicateTabIds, getDisplayHost, getSiteKey, getSiteName, isOrbitUrl, matchesQuery } from "./utils.js";
import { brandIcon, uiIcon } from "./icons.js";

const hasExtensionApi = Boolean(globalThis.chrome?.runtime?.id && globalThis.chrome?.windows);
const demoMode = !hasExtensionApi || new URLSearchParams(location.search).has("demo");
const i18n = globalThis.OrbitI18n;
const t = (key, params) => i18n.t(key, params);
const number = (value) => new Intl.NumberFormat(i18n.locale).format(value);
const state = { windows: [], query: "", sort: "count", duplicatesOnly: false, selected: new Set(), error: "", closing: false, syncing: false };
const $ = (id) => document.getElementById(id);
const elements = {
  search: $("global-search"), sites: $("sites-list"), dialog: $("action-dialog"),
  confirm: $("dialog-confirm"), selection: $("selection-bar"), closeSelected: $("close-selected")
};
const escapeHtml = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
let readSequence = 0;
const pendingReads = new Set();
let manualSyncRequested = false;
let confirmHandler = null;
let dialogOrigin = null;
let dialogDescription = null;
const activeToasts = new Map();

function callApi(context, method, ...args) {
  return new Promise((resolve, reject) => {
    try {
      context[method](...args, (result) => {
        const error = globalThis.chrome?.runtime?.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      });
    } catch (error) { reject(error); }
  });
}

function demoFixtures() {
  const samples = [
    ["YouTube", "Designing a calmer digital workspace", "https://www.youtube.com/watch?v=workspace"],
    ["YouTube", "Radiohead — In Rainbows · From the Basement", "https://www.youtube.com/watch?v=radiohead"],
    ["YouTube", "How great products are made", "https://www.youtube.com/watch?v=products"],
    ["YouTube", "稍后观看", "https://www.youtube.com/playlist?list=WL"],
    ["YouTube", "Designing a calmer digital workspace", "https://www.youtube.com/watch?v=workspace"],
    ["Figma", "Orbit · 移动端设计稿", "https://www.figma.com/design/example/Mobile"],
    ["Figma", "Design System · Components", "https://www.figma.com/design/system/Components"],
    ["Figma", "官网改版 · Exploration", "https://www.figma.com/design/web/Exploration"],
    ["Figma", "产品流程 · User Journey", "https://www.figma.com/board/flow/Journey"],
    ["GitHub", "openai / openai-cookbook", "https://github.com/openai/openai-cookbook"],
    ["GitHub", "tailwindlabs / tailwindcss", "https://github.com/tailwindlabs/tailwindcss"],
    ["GitHub", "Trending repositories", "https://github.com/trending"],
    ["GitHub", "openai / openai-cookbook", "https://github.com/openai/openai-cookbook"],
    ["Notion", "本周待办与工作记录", "https://www.notion.so/weekly"],
    ["Notion", "产品需求 · 标签页管理", "https://www.notion.so/tab-manager"],
    ["Notion", "阅读笔记与灵感", "https://www.notion.so/reading"],
    ["Notion", "本周待办与工作记录", "https://www.notion.so/weekly"],
    ["Google Docs", "Orbit · 产品规划", "https://docs.google.com/document/d/plan/edit"],
    ["Google Docs", "功能验收清单", "https://docs.google.com/spreadsheets/d/checklist/edit"],
    ["Google Docs", "九月工作安排", "https://docs.google.com/document/d/september/edit"],
    ["Gemini", "竞品分析与市场研究", "https://gemini.google.com/app/research"],
    ["Gemini", "落地页文案打磨", "https://gemini.google.com/app/copy"],
    ["Gemini", "产品想法整理", "https://gemini.google.com/app/ideas"],
    ["X", "首页 · 正在关注", "https://x.com/home"],
    ["X", "收藏的文章", "https://x.com/i/bookmarks"],
    ["X", "OpenAI", "https://x.com/OpenAI"],
    ["TradingView", "BTCUSD · Bitcoin / U.S. Dollar", "https://www.tradingview.com/chart/BTC"],
    ["TradingView", "NASDAQ · Market overview", "https://www.tradingview.com/markets/stocks-usa/"],
    ["Lark Docs", "Weekly notes · Team workspace", "https://sample.sg.larksuite.com/wiki/weekly"],
    ["Lark Docs", "A calmer workspace · Ideas", "https://sample.sg.larksuite.com/docx/ideas"],
    ["Meegle", "Orbit · Product roadmap", "https://project.larksuite.com/demo/roadmap"],
    ["OKX", "Market overview", "https://www.okx.com/markets"]
  ];
  const tabs = samples.map(([, title, url], i) => ({
    id: i + 1, title, url, lastAccessed: Date.now() - (i + 1) * 80000,
    pinned: i === 0, active: i === 5, windowId: i < 20 ? 101 : 102
  }));
  return [
    { id: 101, focused: true, state: "normal", tabs: tabs.filter((t) => t.windowId === 101) },
    { id: 102, focused: false, state: "normal", tabs: tabs.filter((t) => t.windowId === 102) }
  ];
}

async function readWindows() {
  if (demoMode) return state.windows.length ? state.windows : demoFixtures();
  return callApi(chrome.windows, "getAll", { populate: true, windowTypes: ["normal"] });
}

async function loadState({ manual = false } = {}) {
  if (manual && (state.syncing || state.closing)) return;
  if (manual) manualSyncRequested = true;
  const sequence = ++readSequence;
  // Superseded reads must not keep the retry control busy after the newest read settles.
  pendingReads.clear();
  pendingReads.add(sequence);
  state.syncing = true;
  render();
  try {
    const windows = await readWindows();
    if (sequence !== readSequence) return;
    state.windows = windows;
    state.error = "";
    if (manualSyncRequested) toast(() => t(demoMode ? "sync.demoSuccess" : "sync.success"));
    manualSyncRequested = false;
  } catch (error) {
    if (sequence !== readSequence) return;
    state.error = error.message || null;
    // Keep the last successful snapshot; never show demo data on API failure.
    if (manualSyncRequested) toast(() => t("sync.failedToast"));
    manualSyncRequested = false;
  } finally {
    pendingReads.delete(sequence);
    state.syncing = pendingReads.size > 0;
    if (!state.syncing) manualSyncRequested = false;
    render();
  }
}

function tabRecords() {
  return state.windows.flatMap((win, windowIndex) => (win.tabs || [])
    .map((tab) => ({ ...tab, url: tab.url || tab.pendingUrl || "", windowId: tab.windowId ?? win.id, windowNumber: windowIndex + 1, windowState: win.state }))
    .filter((tab) => !isOrbitUrl(tab.url, location.href)));
}

function groupSites(tabs) {
  const groups = new Map();
  for (const tab of tabs) {
    const key = getSiteKey(tab.url);
    if (!groups.has(key)) groups.set(key, { key, name: getSiteName(tab.url, i18n.locale), host: getDisplayHost(tab.url, i18n.locale), tabs: [] });
    groups.get(key).tabs.push(tab);
  }
  const sites = [...groups.values()];
  const byName = (a, b) => a.name.localeCompare(b.name, i18n.locale, { numeric: true });
  sites.sort((a, b) => {
    if (state.sort === "name") return byName(a, b);
    if (state.sort === "recent") return Math.max(...b.tabs.map((t) => t.lastAccessed || 0)) - Math.max(...a.tabs.map((t) => t.lastAccessed || 0)) || byName(a, b);
    return b.tabs.length - a.tabs.length || byName(a, b);
  });
  return sites;
}

function logoMarkup(site) {
  const fallback = brandIcon(site.name) || '<span aria-hidden="true">' + escapeHtml((site.name[0] || "·").toUpperCase()) + "</span>";
  let src = "";
  if (!demoMode && /^https?:/.test(site.tabs[0].url)) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", site.tabs[0].url);
    url.searchParams.set("size", "64");
    src = url.href;
  }
  return '<span class="site-logo" role="img" aria-label="' + escapeHtml(t("site.logo", { name: site.name })) + '">' + fallback +
    (src ? '<img src="' + escapeHtml(src) + '" alt="" decoding="async" />' : "") + "</span>";
}

function pagePath(tab) {
  try {
    const url = new URL(tab.url);
    const path = decodeURI(url.pathname + url.search + url.hash);
    return path === "/" ? getDisplayHost(tab.url, i18n.locale) : path;
  } catch { return getDisplayHost(tab.url, i18n.locale); }
}

function tabMarkup(tab, duplicateIds) {
  const duplicate = duplicateIds.has(tab.id);
  const title = tab.title || getSiteName(tab.url, i18n.locale) || t("tab.untitled");
  const checkbox = state.duplicatesOnly && duplicate
    ? '<input id="select-' + tab.id + '" class="tab-select" type="checkbox" data-action="select-tab" data-tab-id="' + tab.id + '" aria-label="' + escapeHtml(t("tab.select", { title })) + '" ' + (state.selected.has(tab.id) ? "checked" : "") + ' />' : "";
  const detail = escapeHtml(pagePath(tab));
  return '<div class="tab-row' + (tab.active ? " is-active" : "") + '" data-tab-id="' + tab.id + '">' + checkbox +
    '<button class="tab-focus" data-action="focus-tab" data-tab-id="' + tab.id + '" title="' + escapeHtml(title + "\n" + tab.url) + '" aria-label="' + escapeHtml(t("tab.focus", { title })) + '">' +
    '<span class="page-icon' + (tab.pinned ? " is-pinned" : "") + '">' + uiIcon(tab.audible ? "sound" : tab.pinned ? "pin" : "page") + '</span>' +
    '<span class="tab-copy"><span class="tab-title">' + escapeHtml(title) + '</span><span class="tab-meta">' +
    (duplicate ? '<span class="duplicate-badge">' + escapeHtml(t("tab.duplicate")) + '</span>' : "") +
    (tab.active ? '<span class="active-badge">' + escapeHtml(t("tab.active")) + '</span>' : "") +
    (tab.pinned ? '<span class="active-badge">' + escapeHtml(t("tab.pinned")) + '</span>' : "") +
    (tab.discarded ? '<span>' + escapeHtml(t("tab.discarded")) + '</span>' : "") +
    '<span class="tab-path">' + detail + '</span>' +
    (state.windows.length > 1 ? '<span>· ' + escapeHtml(t("tab.window", { number: number(tab.windowNumber) })) + '</span>' : "") +
    '</span></span></button><button class="tab-close" data-action="close-tab" data-tab-id="' + tab.id + '" title="' + escapeHtml(t("tab.closeTitle")) + '" aria-label="' + escapeHtml(t("tab.close", { title })) + '">' + uiIcon("close") + '</button></div>';
}

function siteMarkup(site, shownTabs, duplicateIds) {
  return '<article class="site-card" data-site-key="' + escapeHtml(site.key) + '">' +
    '<header class="site-header">' + logoMarkup(site) +
    '<div class="site-title"><h3>' + escapeHtml(site.name) + '</h3><p>' + escapeHtml(site.host) + '</p></div>' +
    '<span class="site-total" title="' + escapeHtml(t("site.total")) + '">' + (shownTabs.length === site.tabs.length ? number(site.tabs.length) : number(shownTabs.length) + "/" + number(site.tabs.length)) + '</span></header>' +
    '<div class="site-tabs">' + shownTabs.map((tab) => tabMarkup(tab, duplicateIds)).join("") + '</div></article>';
}

function emptyMarkup(title, description, action = "") {
  return '<div class="empty-state"><strong>' + escapeHtml(title) + '</strong><p>' + escapeHtml(description) + '</p>' + action + '</div>';
}

function renderSync() {
  const failed = state.error !== "";
  $("sync-label").textContent = t(state.syncing ? "sync.loading" : failed ? "sync.failure" : demoMode ? "sync.demo" : "sync.live");
  $("sync-status").classList.toggle("is-demo", demoMode);
  $("sync-status").classList.toggle("is-error", failed && !state.syncing);
  $("sync-status").classList.toggle("is-loading", state.syncing);
  const button = $("sync-button");
  if (button) {
    const label = t(state.syncing ? "sync.loading" : failed ? "sync.retry" : "sync.manual");
    button.disabled = state.syncing || state.closing;
    button.setAttribute("aria-busy", String(state.syncing));
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.classList.toggle("is-loading", state.syncing);
    $("sync-button-label").textContent = label;
  }
}

function countText(key, count, emphasize = false) {
  const value = number(count);
  return t(key, { count: emphasize ? "<strong>" + value + "</strong>" : value, _count: count });
}

function render() {
  const focusId = document.activeElement?.id;
  const tabs = tabRecords();
  const sites = groupSites(tabs);
  const duplicates = new Set(findDuplicateTabIds(tabs, location.href));
  state.selected = new Set([...state.selected].filter((id) => duplicates.has(id)));
  $("hero-summary").innerHTML = t("summary", { tabs: countText("summary.tabs", tabs.length, true), sites: countText("summary.sites", sites.length, true), windows: state.windows.length > 1 ? countText("summary.windows", state.windows.length, true) : "" });
  renderSync();
  $("demo-notice").hidden = !demoMode;
  $("site-count").textContent = number(sites.length);
  $("duplicate-count").textContent = number(duplicates.size);
  for (const [id, active] of [["all-filter", !state.duplicatesOnly], ["duplicate-filter", state.duplicatesOnly]]) {
    $(id).classList.toggle("is-active", active);
    $(id).setAttribute("aria-pressed", String(active));
  }
  elements.selection.hidden = !state.duplicatesOnly || !duplicates.size;
  $("selection-summary").textContent = t("selection.summary", { selected: number(state.selected.size), total: number(duplicates.size) });
  const visibleDuplicateIds = tabs.filter((tab) => duplicates.has(tab.id) && matchesQuery(tab, state.query, i18n.locale)).map((tab) => tab.id);
  $("select-all").textContent = t(visibleDuplicateIds.length && visibleDuplicateIds.every((id) => state.selected.has(id)) ? "selection.none" : "selection.all");
  $("select-all").disabled = !visibleDuplicateIds.length;
  elements.closeSelected.disabled = !state.selected.size || state.closing;
  elements.closeSelected.textContent = t(state.selected.size ? "selection.closeCount" : "selection.close", { count: number(state.selected.size) });
  $("results-heading").textContent = t(state.duplicatesOnly ? "results.duplicates" : "results.all");
  const results = sites.flatMap((site) => {
    if (state.duplicatesOnly && !site.tabs.some((tab) => duplicates.has(tab.id))) return [];
    const shown = site.tabs.filter((tab) => matchesQuery(tab, state.query, i18n.locale));
    return shown.length ? [{ site, shown }] : [];
  });
  $("results-summary").textContent = state.query.trim() ? t("results.summary", { tabs: countText("summary.tabs", results.reduce((n, item) => n + item.shown.length, 0)), sites: countText("summary.sites", results.length) }) : t("results.hint");
  elements.sites.innerHTML = results.map(({ site, shown }) => siteMarkup(site, shown, duplicates)).join("");
  if (state.error !== "") {
    elements.sites.innerHTML = emptyMarkup(t("sync.errorTitle"), t("sync.errorDescription", { error: state.error || t("sync.unknownError") }), '<button class="secondary-button" data-action="retry"' + (state.syncing || state.closing ? ' disabled' : '') + '>' + escapeHtml(t(state.syncing ? "sync.loading" : "sync.retry")) + '</button>') + elements.sites.innerHTML;
  } else if (!results.length) {
    elements.sites.innerHTML = state.query.trim()
      ? emptyMarkup(t("empty.searchTitle"), t("empty.searchDescription"), '<button class="secondary-button" data-action="clear-search">' + escapeHtml(t("empty.clear")) + '</button>')
      : state.duplicatesOnly
        ? emptyMarkup(t("empty.duplicatesTitle"), t("empty.duplicatesDescription"), '<button class="secondary-button" data-action="show-all">' + escapeHtml(t("empty.all")) + '</button>')
        : emptyMarkup(t("empty.title"), t("empty.description"));
  }
  if (focusId?.startsWith("select-")) $(focusId)?.focus({ preventScroll: true });
}

function updateGreeting() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 5 ? "night" : hour < 11 ? "morning" : hour < 14 ? "noon" : hour < 18 ? "afternoon" : "evening";
  $("time-greeting").innerHTML = escapeHtml(t("greeting." + greeting)) + '<span>' + escapeHtml(t("greeting." + greeting + "Note")) + '</span>';
  $("today-date").textContent = new Intl.DateTimeFormat(i18n.locale, { month: "long", day: "numeric", weekday: "long" }).format(now);
}

function toast(message) {
  const item = document.createElement("div");
  item.className = "toast";
  const resolve = typeof message === "function" ? message : () => message;
  activeToasts.set(item, resolve);
  item.textContent = resolve();
  $("toast-region").append(item);
  setTimeout(() => { activeToasts.delete(item); item.remove(); }, 4200);
}

function renderDialog() {
  if (!dialogDescription) return;
  const { title, description, content = "", confirmLabel = () => t("dialog.confirm") } = dialogDescription;
  const resolve = (value) => typeof value === "function" ? value() : value;
  $("dialog-title").textContent = resolve(title);
  $("dialog-description").textContent = resolve(description);
  $("dialog-content").innerHTML = resolve(content);
  elements.confirm.textContent = resolve(confirmLabel);
}

function openDialog(description) {
  const { danger = false, onConfirm } = description;
  dialogOrigin = document.activeElement;
  dialogDescription = description;
  renderDialog();
  $("dialog-cancel").hidden = !onConfirm;
  elements.confirm.className = danger ? "danger-button" : "primary-button";
  elements.confirm.disabled = false;
  confirmHandler = onConfirm || (() => true);
  elements.dialog.showModal();
  (onConfirm ? $("dialog-cancel") : elements.confirm).focus();
}

function closeDialog() {
  if (state.closing) return;
  elements.dialog.close();
  confirmHandler = null;
  dialogDescription = null;
  if (dialogOrigin?.isConnected) dialogOrigin.focus({ preventScroll: true });
}

function showHelp() {
  openDialog({
    title: () => t("help.title"),
    description: () => t("help.description"),
    content: () => '<ol>' + (demoMode ? ["help.demo1", "help.demo2", "help.demo3"] : ["help.step1", "help.step2", "help.step3"]).map((key) => '<li>' + escapeHtml(t(key)) + '</li>').join("") + '</ol>' +
      (demoMode ? "" : '<p>' + escapeHtml(t("help.privacy")) + '</p>') + '<p>' + escapeHtml(t("help.preferences")) + '</p><p>' + escapeHtml(t("help.shortcut")) + '</p>',
    confirmLabel: () => t("dialog.gotIt")
  });
}

async function focusTab(id) {
  const tab = tabRecords().find((t) => t.id === Number(id));
  if (!tab) return loadState();
  if (demoMode) {
    for (const win of state.windows) {
      win.focused = win.id === tab.windowId;
      if (win.id === tab.windowId) win.tabs.forEach((t) => { t.active = t.id === tab.id; });
    }
    render();
    toast(() => t("toast.previewFocus", { title: tab.title || t("tab.untitled") }));
    return;
  }
  await callApi(chrome.tabs, "update", tab.id, { active: true });
  const currentWindow = await callApi(chrome.windows, "get", tab.windowId);
  const properties = { focused: true };
  if (currentWindow.state === "minimized") properties.state = "normal";
  await callApi(chrome.windows, "update", tab.windowId, properties);
}

async function removeTabs(ids) {
  if (!ids.length) return;
  if (demoMode) {
    const remove = new Set(ids);
    for (const win of state.windows) win.tabs = win.tabs.filter((tab) => !remove.has(tab.id));
    state.windows = state.windows.filter((win) => win.tabs.length);
    render();
  } else {
    await callApi(chrome.tabs, "remove", ids);
    await loadState();
  }
}

function selectedSnapshot() {
  return tabRecords().filter((tab) => state.selected.has(tab.id)).map((tab) => ({ id: tab.id, url: tab.url, title: tab.title }));
}

function confirmCloseDuplicates() {
  const selected = selectedSnapshot();
  if (!selected.length) return;
  openDialog({
    title: () => t("duplicates.title", { count: number(selected.length), _count: selected.length }),
    description: () => t("duplicates.description"),
    content: '<ul class="dialog-tab-list">' + selected.map((tab) => '<li>' + escapeHtml(tab.title || tab.url) + '</li>').join("") + "</ul>",
    confirmLabel: () => t("duplicates.confirm"), danger: true,
    onConfirm: async () => {
      state.closing = true;
      renderSync();
      try {
        // Re-read before removal: a selected tab may have navigated or become active.
        const sequence = ++readSequence;
        pendingReads.clear();
        state.syncing = false;
        manualSyncRequested = false;
        renderSync();
        const fresh = await readWindows();
        if (sequence !== readSequence) { toast(() => t("toast.changed")); return true; }
        state.windows = fresh;
        state.error = "";
        const current = tabRecords();
        const duplicates = new Set(findDuplicateTabIds(current, location.href));
        const ids = selected.filter((old) => duplicates.has(old.id) && current.some((tab) => tab.id === old.id && tab.url === old.url)).map((tab) => tab.id);
        await removeTabs(ids);
        state.selected.clear();
        toast(() => ids.length ? t("toast.duplicatesClosed", { count: number(ids.length), _count: ids.length }) + (ids.length < selected.length ? t("toast.skipped") : "") : t("toast.noneClosed"));
        return true;
      } finally { state.closing = false; render(); }
    }
  });
}

async function handleAction(action, target) {
  switch (action) {
    case "help": showHelp(); break;
    case "sync":
    case "retry": await loadState({ manual: true }); break;
    case "show-all": state.duplicatesOnly = false; state.selected.clear(); render(); break;
    case "show-duplicates":
      state.duplicatesOnly = true; state.query = ""; elements.search.value = ""; state.selected.clear(); render(); break;
    case "clear-search": state.query = ""; elements.search.value = ""; render(); elements.search.focus(); break;
    case "select-all": {
      const ids = findDuplicateTabIds(tabRecords(), location.href);
      const visibleIds = ids.filter((id) => tabRecords().some((tab) => tab.id === id && matchesQuery(tab, state.query, i18n.locale)));
      const all = visibleIds.length > 0 && visibleIds.every((id) => state.selected.has(id));
      for (const id of visibleIds) all ? state.selected.delete(id) : state.selected.add(id);
      render(); break;
    }
    case "close-selected": confirmCloseDuplicates(); break;
    case "focus-tab": await focusTab(target.dataset.tabId); break;
    case "close-tab":
      if (state.closing) return;
      target.disabled = true;
      try { await removeTabs([Number(target.dataset.tabId)]); toast(() => t("toast.tabClosed")); }
      finally { target.disabled = false; }
      break;
    case "close-dialog": closeDialog(); break;
  }
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest?.("[data-action]");
  if (!target || target.matches("input")) return;
  event.preventDefault();
  try { await handleAction(target.dataset.action, target); }
  catch (error) { toast(() => t("toast.failed", { error: error.message || t("sync.unknownError") })); }
});

document.addEventListener("change", (event) => {
  if (event.target.dataset.action !== "select-tab") return;
  const id = Number(event.target.dataset.tabId);
  event.target.checked ? state.selected.add(id) : state.selected.delete(id);
  render();
});

document.addEventListener("error", (event) => {
  if (event.target.matches?.(".site-logo img")) event.target.remove();
}, true);

elements.search.addEventListener("input", () => {
  state.query = elements.search.value;
  state.selected.clear();
  render();
});
$("site-sort").addEventListener("change", (event) => { state.sort = event.target.value; render(); });
elements.confirm.addEventListener("click", async () => {
  if (!confirmHandler || elements.confirm.disabled) return;
  elements.confirm.disabled = true;
  try { if (await confirmHandler() !== false) closeDialog(); }
  catch (error) { toast(() => t("toast.failed", { error: error.message || t("sync.unknownError") })); }
  finally { elements.confirm.disabled = false; }
});
elements.dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeDialog(); });
elements.dialog.addEventListener("click", (event) => { if (event.target === elements.dialog) closeDialog(); });

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !elements.dialog.open) {
    event.preventDefault(); elements.search.focus(); elements.search.select();
  }
  if (event.key === "Escape" && !elements.dialog.open) {
    if (state.query) { state.query = ""; elements.search.value = ""; state.selected.clear(); }
    else { state.duplicatesOnly = false; state.selected.clear(); }
    render();
  }
});

let refreshTimer;
function scheduleRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(loadState, 120);
}
if (!demoMode) {
  [chrome.tabs.onCreated, chrome.tabs.onRemoved, chrome.tabs.onUpdated, chrome.tabs.onActivated,
    chrome.tabs.onAttached, chrome.tabs.onDetached, chrome.tabs.onMoved,
    chrome.windows.onCreated, chrome.windows.onRemoved, chrome.windows.onFocusChanged]
    .forEach((event) => event?.addListener(scheduleRefresh));
}
$("search-shortcut").textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";
i18n.subscribe(() => {
  updateGreeting();
  render();
  renderDialog();
  for (const [item, resolve] of activeToasts) item.textContent = resolve();
});
updateGreeting();
setInterval(updateGreeting, 60000);
loadState();
