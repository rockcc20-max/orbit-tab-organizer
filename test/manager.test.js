import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script, createContext } from "node:vm";

const managerUrl = "chrome-extension://orbit-test/manager.html";
const bundle = await readFile(new URL("../manager.bundle.js", import.meta.url), "utf8");
const localeSource = await readFile(new URL("../i18n.js", import.meta.url), "utf8");
const html = await readFile(new URL("../manager.html", import.meta.url), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));
const tab = (id, url, properties = {}) => ({ id, title: `Page ${id}`, url, lastAccessed: 100 - id, ...properties });
const window = (id, tabs, state = "normal") => ({ id, state, tabs: tabs.map((item) => ({ ...item, windowId: id })) });

// The bundle is exercised through its public UI events, not internal functions.
// This small DOM only records observable output; it is not a browser substitute.
async function mount(initialWindows, initialFailures = {}, options = {}) {
  const handlers = new Map();
  const globalHandlers = new Map();
  const elements = new Map();
  const calls = [];
  const failures = { ...initialFailures };
  let windows = plain(initialWindows);
  let deferReads = false;
  const pendingReads = [];
  let updateListener;
  let scheduledRefresh;
  const stored = new Map();
  const localStorage = { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key) };
  const document = {
    readyState: "complete", documentElement: { lang: "", dataset: {}, setAttribute(name, value) { this[name] = value; } },
    title: "", querySelectorAll: () => [],
    activeElement: null,
    getElementById: (id) => elements.get(id) || null,
    createElement: () => makeElement(),
    addEventListener: (name, callback) => {
      if (!handlers.has(name)) handlers.set(name, []);
      handlers.get(name).push(callback);
    }
  };
  function makeElement(id = "", dataset = {}, tagName = "button") {
    const listeners = new Map();
    const classes = new Set();
    const attributes = new Map();
    return {
      id, dataset, tagName, innerHTML: "", textContent: "", value: "", children: [],
      hidden: false, disabled: false, checked: false, open: false, isConnected: true,
      classList: {
        toggle(name, force) { if (force ?? !classes.has(name)) classes.add(name); else classes.delete(name); },
        contains: (name) => classes.has(name)
      },
      setAttribute: (name, value) => attributes.set(name, value),
      getAttribute: (name) => attributes.get(name),
      addEventListener(name, callback) {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(callback);
      },
      async dispatch(name, event = {}) {
        for (const callback of listeners.get(name) || []) await callback({ target: this, preventDefault() {}, ...event });
      },
      append(item) { this.children.push(item); },
      remove() { this.isConnected = false; },
      matches: (selector) => selector === "input" && tagName === "input",
      closest: (selector) => selector === "[data-action]" && dataset.action ? elements.get(id) || null : null,
      focus() { document.activeElement = this; },
      select() {},
      showModal() { this.open = true; },
      close() { this.open = false; }
    };
  }
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) elements.set(id, makeElement(id));
  const runtime = { id: "orbit-test", getURL: (path) => new URL(path, managerUrl).href };
  function api(method, result, mutate = () => {}) {
    return (...args) => {
      const callback = args.pop();
      calls.push({ method, args: plain(args) });
      const failure = failures[method];
      const snapshot = !failure ? plain(result(...args)) : null;
      const deliver = () => {
        if (failure) {
          runtime.lastError = { message: failure }; callback(); delete runtime.lastError;
        } else { mutate(...args); callback(snapshot); }
      };
      if (deferReads && method === "windows.getAll") pendingReads.push(deliver);
      else deliver();
    };
  }
  const chrome = {
    runtime,
    windows: {
      getAll: api("windows.getAll", () => windows),
      get: api("windows.get", (id) => windows.find((item) => item.id === id)),
      update: api("windows.update", (id) => windows.find((item) => item.id === id), (id, properties) => Object.assign(windows.find((item) => item.id === id), properties))
    },
    tabs: {
      onUpdated: { addListener(listener) { updateListener = listener; } },
      update: api("tabs.update", (id) => windows.flatMap((item) => item.tabs).find((item) => item.id === id)),
      remove: api("tabs.remove", () => null, (ids) => {
        for (const item of windows) item.tabs = item.tabs.filter((entry) => !ids.includes(entry.id));
      })
    }
  };
  const context = createContext({
    chrome, document, localStorage, location: { href: managerUrl, search: "" }, navigator: { platform: "MacIntel", language: options.locale || "zh-CN", languages: [options.locale || "zh-CN"] },
    addEventListener(name, callback) { if (!globalHandlers.has(name)) globalHandlers.set(name, []); globalHandlers.get(name).push(callback); },
    dispatchEvent(event) { for (const callback of globalHandlers.get(event.type) || []) callback(event); },
    CustomEvent: class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    Event: class { constructor(type) { this.type = type; } },
    URL, URLSearchParams, setTimeout: (callback, delay) => { if (delay === 120) scheduledRefresh = callback; return 1; }, clearTimeout() {}, setInterval: () => 1
  });
  new Script(localeSource, { filename: "i18n.js" }).runInContext(context);
  new Script(bundle, { filename: "manager.bundle.js" }).runInContext(context);
  await new Promise(setImmediate);
  return {
    calls, failures, document, element: (id) => elements.get(id),
    setLanguage: (value) => context.OrbitI18n.setLanguage(value),
    deferReads(value) { deferReads = value; },
    browserRefresh() { updateListener(); return scheduledRefresh(); },
    pendingReadCount: () => pendingReads.length,
    async flushRead(index = 0) { pendingReads.splice(index, 1)[0]?.(); await new Promise(setImmediate); },
    setWindows: (value) => { windows = plain(value); },
    toasts: () => elements.get("toast-region").children.map((item) => item.textContent).join("\n"),
    async action(action, properties = {}) {
      const id = "test-action";
      const target = makeElement(id, { action, ...properties });
      elements.set(id, target);
      for (const callback of handlers.get("click") || []) await callback({ target, preventDefault() {} });
      return target;
    },
    async confirm() { await elements.get("dialog-confirm").dispatch("click"); },
    async selectDuplicates() {
      await this.action("show-duplicates");
      await this.action("select-all");
      await this.action("close-selected");
      assert.equal(elements.get("action-dialog").open, true);
      assert.equal(calls.some((item) => item.method === "tabs.remove"), false, "selection must not close tabs before confirmation");
    }
  };
}

test("extension startup excludes Orbit itself but preserves another extension's manager page", async () => {
  const app = await mount([window(10, [
    tab(1, managerUrl + "?view=all#top"),
    tab(2, "https://www.youtube.com/watch?v=one"),
    tab(3, "https://m.youtube.com/watch?v=two"),
    tab(4, "chrome-extension://different-extension/manager.html")
  ])]);
  assert.match(app.element("hero-summary").innerHTML, /<strong>3<\/strong> 个标签页/);
  assert.equal(app.element("site-count").textContent, "2");
  assert.equal((app.element("sites-list").innerHTML.match(/<h3>YouTube<\/h3>/g) || []).length, 1);
  assert.match(app.element("sites-list").innerHTML, /different-extension/);
  assert.doesNotMatch(app.element("sites-list").innerHTML, /data-tab-id="1"/);
  assert.equal(app.element("demo-notice").hidden, true);
  assert.equal(app.element("sync-label").textContent, "已实时同步");
});

test("extension help opens normal usage and local-only privacy without developer installation instructions", async () => {
  const app = await mount([window(10, [tab(1, "https://example.com/")])]);
  assert.match(html, /<button\b[^>]*id="help-button"[^>]*data-action="help"/);
  await app.action("help");
  assert.equal(app.element("action-dialog").open, true);
  assert.match(app.element("dialog-description").textContent, /点击 Orbit 图标.*查看所有窗口的标签页/);
  const content = app.element("dialog-content").innerHTML;
  assert.match(content, /拼图菜单中固定 Orbit/);
  assert.match(content, /点击页面名称可回到原标签页/);
  assert.match(content, /先勾选.*关闭选中项.*确认/);
  assert.match(content, /仅在本机读取当前标签页的标题、网址与窗口状态/);
  assert.match(content, /不上传浏览信息/);
  assert.doesNotMatch(content, /开发者模式|加载已解压的扩展程序|chrome:\/\/extensions/);
});

test("cross-window focus restores minimized windows while preserving other window modes", async () => {
  for (const state of ["normal", "minimized", "maximized", "fullscreen"]) {
    const app = await mount([window(10, [tab(1, "https://example.com/")], state)]);
    await app.action("focus-tab", { tabId: "1" });
    const writes = app.calls.filter((item) => item.method.endsWith(".update"));
    assert.deepEqual(writes, [
      { method: "tabs.update", args: [1, { active: true }] },
      { method: "windows.update", args: [10, state === "minimized" ? { focused: true, state: "normal" } : { focused: true }] }
    ], state);
  }
});

test("focus checks current window mode rather than restoring a stale minimized snapshot", async () => {
  const app = await mount([window(10, [tab(1, "https://example.com/")], "minimized")]);
  app.setWindows([window(10, [tab(1, "https://example.com/")], "maximized")]);
  await app.action("focus-tab", { tabId: "1" });
  assert.deepEqual(app.calls.filter((item) => item.method === "windows.update"), [
    { method: "windows.update", args: [10, { focused: true }] }
  ]);
});

test("duplicate confirmation re-reads tabs and skips navigated or newly active pages", async () => {
  const a = "https://example.com/a";
  const b = "https://example.com/b";
  const c = "https://example.com/c";
  const original = [window(10, [tab(1, a), tab(2, a), tab(3, b), tab(4, b), tab(5, c), tab(6, c)])];
  const app = await mount(original);
  await app.selectDuplicates();
  assert.match(app.element("dialog-title").textContent, /3/);
  app.setWindows([window(10, [tab(1, a), tab(2, a + "/edited"), tab(3, b), tab(4, b, { active: true }), tab(5, c), tab(6, c)])]);
  await app.confirm();
  assert.deepEqual(app.calls.filter((item) => item.method === "tabs.remove"), [{ method: "tabs.remove", args: [[6]] }]);
  assert.equal(app.calls.filter((item) => item.method === "windows.getAll").length, 3);
  assert.equal(app.element("action-dialog").open, false);
  assert.match(app.toasts(), /已关闭 1 个重复页面.*跳过状态发生变化/);
});

test("duplicate confirmation protects pending navigation and reports when nothing can be closed", async () => {
  const url = "https://example.com/a";
  const app = await mount([window(10, [tab(1, url), tab(2, url)])]);
  await app.selectDuplicates();
  app.setWindows([window(10, [tab(1, url), tab(2, url, { pendingUrl: "https://example.com/form" })])]);
  await app.confirm();
  assert.equal(app.calls.some((item) => item.method === "tabs.remove"), false);
  assert.match(app.toasts(), /本次未关闭任何页面/);
});

test("read errors surface in the page and retry recovers without demo data", async () => {
  const app = await mount([window(10, [tab(1, "https://example.com/")])], { "windows.getAll": "Browser unavailable" });
  assert.equal(app.element("sync-label").textContent, "同步失败");
  assert.match(app.element("sites-list").innerHTML, /Browser unavailable/);
  assert.equal(app.element("demo-notice").hidden, true);
  delete app.failures["windows.getAll"];
  await app.action("retry");
  assert.equal(app.element("sync-label").textContent, "已实时同步");
  assert.doesNotMatch(app.element("sites-list").innerHTML, /Browser unavailable/);
});

test("write errors are shown and a failed tab close does not report success", async () => {
  const app = await mount([window(10, [tab(1, "https://example.com/")])]);
  app.failures["tabs.remove"] = "Tab cannot be closed";
  const close = await app.action("close-tab", { tabId: "1" });
  assert.equal(close.disabled, false);
  assert.match(app.toasts(), /操作未完成：Tab cannot be closed/);
  assert.doesNotMatch(app.toasts(), /页面已关闭/);
  app.failures["tabs.update"] = "Tab disappeared";
  await app.action("focus-tab", { tabId: "1" });
  assert.match(app.toasts(), /Tab disappeared/);
  assert.equal(app.calls.some((item) => item.method === "windows.update"), false);
});

test("a failed fresh read keeps the confirmation open and never removes tabs", async () => {
  const url = "https://example.com/a";
  const app = await mount([window(10, [tab(1, url), tab(2, url)])]);
  await app.selectDuplicates();
  app.failures["windows.getAll"] = "Could not verify current tabs";
  await app.confirm();
  assert.equal(app.calls.some((item) => item.method === "tabs.remove"), false);
  assert.equal(app.element("action-dialog").open, true);
  assert.equal(app.element("dialog-confirm").disabled, false);
  assert.match(app.toasts(), /Could not verify current tabs/);
});

test("manual sync shows pending state, prevents repeat requests and refreshes current tabs", async () => {
  const app = await mount([window(10, [tab(1, "https://example.com/old")])]);
  app.deferReads(true);
  app.setWindows([window(10, [tab(2, "https://github.com/new")])]);
  const sync = app.action("sync");
  assert.equal(app.element("sync-button").disabled, true);
  assert.equal(app.element("sync-button").getAttribute("aria-busy"), "true");
  assert.equal(app.pendingReadCount(), 1);
  const again = app.action("sync");
  assert.equal(app.pendingReadCount(), 1, "repeated sync must not queue another read");
  await app.flushRead();
  await Promise.all([sync, again]);
  assert.equal(app.element("sync-button").disabled, false);
  assert.equal(app.element("sync-button").getAttribute("aria-busy"), "false");
  assert.match(app.element("sites-list").innerHTML, /github.com\/new/);
  assert.doesNotMatch(app.element("sites-list").innerHTML, /example.com\/old/);
  assert.equal(app.calls.some((item) => item.method === "tabs.remove"), false);
});

test("failed manual sync retains the last successful cards and retry restores live status", async () => {
  const app = await mount([window(10, [tab(1, "https://example.com/keep")])]);
  app.failures["windows.getAll"] = "Sync unavailable";
  await app.action("sync");
  assert.equal(app.element("sync-status").classList.contains("is-error"), true);
  assert.equal(app.element("sync-button").disabled, false);
  assert.match(app.element("sites-list").innerHTML, /example.com\/keep/);
  assert.match(app.element("sites-list").innerHTML, /Sync unavailable/);
  assert.equal(app.element("demo-notice").hidden, true);
  delete app.failures["windows.getAll"];
  await app.action("retry");
  assert.equal(app.element("sync-status").classList.contains("is-error"), false);
  assert.doesNotMatch(app.element("sites-list").innerHTML, /Sync unavailable/);
});

test("all four languages update runtime labels, help and dates without changing tab contents", async () => {
  const app = await mount([window(10, [tab(1, "https://team.sg.larksuite.com/wiki/example", { title: "Original title · 原始标题" })])]);
  const expected = { "zh-CN": /网站/, en: /sites/i, ko: /사이트/, ja: /サイト/ };
  for (const locale of ["en", "ko", "ja", "zh-CN"]) {
    app.setLanguage(locale);
    assert.equal(app.document.documentElement.lang, locale);
    assert.match(app.element("results-heading").textContent, expected[locale]);
    assert.match(app.element("sites-list").innerHTML, /Original title · 原始标题/);
    assert.match(app.element("sites-list").innerHTML, /team.sg.larksuite.com/);
    assert.doesNotMatch(app.element("time-greeting").innerHTML, /所有页面都在这里/);
    await app.action("help");
    if (locale !== "zh-CN") {
      assert.doesNotMatch(app.element("dialog-description").textContent, /在 Chrome 中点击/);
      assert.doesNotMatch(app.element("dialog-content").innerHTML, /拼图菜单中固定/);
    }
    await app.action("close-dialog");
  }
  assert.equal(app.calls.filter((item) => item.method === "windows.getAll").length, 1, "language switch must not read or mutate user tabs");
});

test("an obsolete read never locks manual sync after a newer browser update has completed", async () => {
  const app = await mount([window(10, [tab(1, "https://example.com/original")])]);
  app.deferReads(true);
  app.setWindows([window(10, [tab(1, "https://example.com/stale")])]);
  const first = app.action("sync");
  app.setWindows([window(10, [tab(2, "https://example.com/current")])]);
  const latest = app.browserRefresh();
  assert.equal(app.pendingReadCount(), 2);
  await app.flushRead(1);
  await latest;
  assert.equal(app.element("sync-button").disabled, false);
  assert.equal(app.element("sync-label").textContent, "已实时同步");
  assert.match(app.element("sites-list").innerHTML, /example.com\/current/);
  await app.flushRead(0);
  await first;
  assert.equal(app.element("sync-button").disabled, false);
  assert.doesNotMatch(app.element("sites-list").innerHTML, /example.com\/stale/);
});

test("language changes while a duplicate confirmation is pending preserve its original action", async () => {
  const url = "https://example.com/duplicate";
  const app = await mount([window(10, [tab(1, url), tab(2, url)])]);
  await app.selectDuplicates();
  app.deferReads(true);
  const confirming = app.confirm();
  app.setLanguage("ja");
  assert.equal(app.element("dialog-confirm").disabled, true);
  assert.match(app.element("dialog-title").textContent, /重複ページ/);
  await app.confirm();
  assert.equal(app.pendingReadCount(), 1);
  await app.flushRead();
  // Removal initiates a second, current-state refresh.
  await app.flushRead();
  await confirming;
  assert.deepEqual(app.calls.filter((item) => item.method === "tabs.remove"), [{ method: "tabs.remove", args: [[2]] }]);
  assert.equal(app.element("action-dialog").open, false);
});

test("fresh duplicate validation releases a superseded sync even when no tabs can be closed", async () => {
  const url = "https://example.com/duplicate";
  const app = await mount([window(10, [tab(1, url), tab(2, url)])]);
  await app.selectDuplicates();
  app.deferReads(true);
  const oldSync = app.action("sync");
  app.setWindows([window(10, [tab(1, url), tab(2, url, { active: true })])]);
  const confirming = app.confirm();
  await app.flushRead(1);
  await confirming;
  assert.equal(app.element("sync-button").disabled, false);
  assert.equal(app.calls.some((item) => item.method === "tabs.remove"), false);
  await app.flushRead(0);
  await oldSync;
  assert.equal(app.element("sync-label").textContent, "已实时同步");
});
