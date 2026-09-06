import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script, createContext } from "node:vm";

const managerUrl = "chrome-extension://orbit-test/manager.html";
const bundle = await readFile(new URL("../manager.bundle.js", import.meta.url), "utf8");
const html = await readFile(new URL("../manager.html", import.meta.url), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));
const tab = (id, url, properties = {}) => ({ id, title: `Page ${id}`, url, lastAccessed: 100 - id, ...properties });
const window = (id, tabs, state = "normal") => ({ id, state, tabs: tabs.map((item) => ({ ...item, windowId: id })) });

// The bundle is exercised through its public UI events, not internal functions.
// This small DOM only records observable output; it is not a browser substitute.
async function mount(initialWindows, initialFailures = {}) {
  const handlers = new Map();
  const elements = new Map();
  const calls = [];
  const failures = { ...initialFailures };
  let windows = plain(initialWindows);
  const document = {
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
      if (failures[method]) {
        runtime.lastError = { message: failures[method] };
        callback();
        delete runtime.lastError;
      } else {
        mutate(...args);
        callback(plain(result(...args)));
      }
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
      update: api("tabs.update", (id) => windows.flatMap((item) => item.tabs).find((item) => item.id === id)),
      remove: api("tabs.remove", () => null, (ids) => {
        for (const item of windows) item.tabs = item.tabs.filter((entry) => !ids.includes(entry.id));
      })
    }
  };
  const context = createContext({
    chrome, document, location: { href: managerUrl, search: "" }, navigator: { platform: "MacIntel" },
    URL, URLSearchParams, setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1
  });
  new Script(bundle, { filename: "manager.bundle.js" }).runInContext(context);
  await new Promise(setImmediate);
  return {
    calls, failures, element: (id) => elements.get(id),
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
  assert.match(app.element("hero-summary").innerHTML, /<strong>3<\/strong> 个选项卡/);
  assert.equal(app.element("site-count").textContent, 2);
  assert.equal((app.element("sites-list").innerHTML.match(/<h3>YouTube<\/h3>/g) || []).length, 1);
  assert.match(app.element("sites-list").innerHTML, /different-extension/);
  assert.doesNotMatch(app.element("sites-list").innerHTML, /data-tab-id="1"/);
  assert.equal(app.element("demo-notice").hidden, true);
  assert.equal(app.element("sync-label").textContent, "已实时同步");
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
  assert.equal(app.element("sync-label").textContent, "同步中断");
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
