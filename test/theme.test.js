import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script, createContext } from "node:vm";

const themeSource = await readFile(new URL("../theme.js", import.meta.url), "utf8");

function mountTheme({ stored = null, dark = false, storageDenied = false, mediaUnavailable = false, loading = true } = {}) {
  const documentListeners = new Map();
  const globalListeners = new Map();
  const mediaListeners = new Map();
  const writes = [];
  const timers = [];
  const elements = new Map();
  const values = new Map(stored === null ? [] : [["orbitTheme", stored]]);

  function listen(collection, type, callback) {
    if (!collection.has(type)) collection.set(type, []);
    collection.get(type).push(callback);
  }

  function emit(collection, type, detail = {}) {
    const event = {
      defaultPrevented: false,
      propagationStopped: false,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.propagationStopped = true; },
      ...detail
    };
    for (const callback of collection.get(type) || []) callback(event);
    return event;
  }

  function makeElement(id) {
    const listeners = new Map();
    const attributes = new Map();
    return {
      id,
      dataset: {},
      textContent: "",
      innerHTML: "",
      title: "",
      hidden: false,
      children: [],
      parent: null,
      removed: false,
      addEventListener(type, callback) { listen(listeners, type, callback); },
      dispatch(type, detail) { return emit(listeners, type, { target: this, ...detail }); },
      setAttribute(name, value) { attributes.set(name, String(value)); },
      getAttribute(name) { return attributes.get(name) ?? null; },
      append(child) { child.parent = this; this.children.push(child); },
      remove() { this.removed = true; },
      contains(target) {
        while (target) {
          if (target === this) return true;
          target = target.parent;
        }
        return false;
      },
      focus() { document.activeElement = this; }
    };
  }

  const root = makeElement("html");
  const colorMeta = makeElement("theme-color");
  for (const id of ["theme-control", "theme-toggle", "theme-menu", "theme-label", "theme-icon", "theme-system", "theme-light", "theme-dark", "toast-region"]) {
    elements.set(id, makeElement(id));
  }
  const get = (id) => elements.get(id);
  get("theme-control").append(get("theme-toggle"));
  get("theme-control").append(get("theme-menu"));
  get("theme-toggle").append(get("theme-label"));
  get("theme-toggle").append(get("theme-icon"));
  for (const mode of ["system", "light", "dark"]) get("theme-menu").append(get(`theme-${mode}`));
  get("theme-menu").hidden = true;
  get("theme-toggle").setAttribute("aria-expanded", "false");
  const document = {
    documentElement: root,
    readyState: loading ? "loading" : "complete",
    activeElement: null,
    getElementById(id) { return this.readyState === "loading" ? null : get(id) ?? null; },
    querySelector(selector) { return selector === 'meta[name="theme-color"]' ? colorMeta : null; },
    addEventListener(type, callback) { listen(documentListeners, type, callback); },
    createElement(tagName) { return makeElement(tagName); }
  };
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { writes.push([key, value]); values.set(key, value); }
  };
  const media = {
    matches: dark,
    addEventListener(type, callback) { listen(mediaListeners, type, callback); }
  };
  const context = {
    document,
    addEventListener(type, callback) { listen(globalListeners, type, callback); },
    matchMedia: mediaUnavailable ? undefined : (query) => {
      assert.equal(query, "(prefers-color-scheme: dark)");
      return media;
    },
    setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length; }
  };
  Object.defineProperty(context, "localStorage", {
    get() {
      if (storageDenied) throw new Error("Storage access denied");
      return storage;
    }
  });
  new Script(themeSource, { filename: "theme.js" }).runInContext(createContext(context));

  return {
    root, colorMeta, document, get, storage, writes, timers,
    ready() {
      if (document.readyState !== "loading") return;
      document.readyState = "complete";
      emit(documentListeners, "DOMContentLoaded");
    },
    setSystemDark(matches) { media.matches = matches; emit(mediaListeners, "change", { matches }); },
    storageEvent(detail) { emit(globalListeners, "storage", { storageArea: storage, ...detail }); },
    outsideClick(target = makeElement("outside")) { emit(documentListeners, "click", { target }); }
  };
}

function assertChoice(app, preference, resolved) {
  assert.equal(app.root.dataset.themePreference, preference);
  assert.equal(app.root.dataset.theme, resolved);
  assert.equal(app.colorMeta.getAttribute("content"), resolved === "dark" ? "#171b1a" : "#f7f8fa");
  for (const mode of ["system", "light", "dark"]) {
    assert.equal(app.get(`theme-${mode}`).getAttribute("aria-checked"), String(mode === preference));
  }
}

test("theme follows browser light/dark before the body and controls exist", () => {
  for (const dark of [false, true]) {
    const app = mountTheme({ dark });
    assert.equal(app.root.dataset.theme, dark ? "dark" : "light");
    assert.equal(app.root.dataset.themePreference, "system");
    assert.equal(app.get("theme-label").textContent, "");
    assert.equal(app.writes.length, 0, "default initialization should not modify storage");
    app.ready();
    assertChoice(app, "system", dark ? "dark" : "light");
    assert.equal(app.get("theme-label").textContent, "跟随浏览器");
    assert.match(app.get("theme-toggle").getAttribute("aria-label"), /当前：跟随浏览器/);
  }
});

test("saved manual preference wins before DOMContentLoaded and remains selected", () => {
  for (const stored of ["light", "dark"]) {
    const app = mountTheme({ stored, dark: stored === "light" });
    assert.equal(app.root.dataset.theme, stored);
    assert.equal(app.root.dataset.themePreference, stored);
    app.ready();
    assertChoice(app, stored, stored);
    assert.equal(app.get("theme-label").textContent, stored === "light" ? "白天模式" : "黑夜模式");
  }
});

test("invalid saved preferences fall back to the current browser setting", () => {
  for (const stored of ["", "unknown", "DARK", '"dark"']) {
    const app = mountTheme({ stored, dark: true, loading: false });
    assertChoice(app, "system", "dark");
  }
});

test("system preference follows live browser changes without persisting the resolved color", () => {
  const app = mountTheme({ stored: "system", loading: false });
  assertChoice(app, "system", "light");
  app.setSystemDark(true);
  assertChoice(app, "system", "dark");
  app.setSystemDark(false);
  assertChoice(app, "system", "light");
  assert.deepEqual(app.writes, []);
});

test("manual selections persist, ignore browser changes, and returning to system resumes tracking", () => {
  const app = mountTheme({ loading: false });
  app.get("theme-toggle").dispatch("click");
  app.get("theme-dark").dispatch("click");
  assertChoice(app, "dark", "dark");
  assert.equal(app.get("theme-menu").hidden, true);
  assert.equal(app.get("theme-toggle").getAttribute("aria-expanded"), "false");
  assert.equal(app.document.activeElement, app.get("theme-toggle"));
  app.setSystemDark(true);
  app.setSystemDark(false);
  assertChoice(app, "dark", "dark");
  assert.deepEqual(app.writes, [["orbitTheme", "dark"]]);

  app.get("theme-light").dispatch("click");
  app.setSystemDark(true);
  assertChoice(app, "light", "light");
  app.get("theme-system").dispatch("click");
  assertChoice(app, "system", "dark");
  app.setSystemDark(false);
  assertChoice(app, "system", "light");
  assert.deepEqual(app.writes, [["orbitTheme", "dark"], ["orbitTheme", "light"], ["orbitTheme", "system"]]);

  const reopened = mountTheme({ stored: app.storage.getItem("orbitTheme"), dark: true, loading: false });
  assertChoice(reopened, "system", "dark");
});

test("storage events sync other Orbit pages and storage removal restores system mode", () => {
  const app = mountTheme({ stored: "light", dark: true, loading: false });
  app.storageEvent({ key: "orbitTheme", newValue: "dark" });
  assertChoice(app, "dark", "dark");
  app.storageEvent({ key: "orbitTheme", newValue: "light" });
  assertChoice(app, "light", "light");
  app.storageEvent({ key: "orbitTheme", newValue: null });
  assertChoice(app, "system", "dark");
  app.storageEvent({ key: "orbitTheme", newValue: "light" });
  app.storageEvent({ key: null, newValue: null });
  assertChoice(app, "system", "dark");
  assert.deepEqual(app.writes, [], "synchronization must not trigger a storage feedback loop");
});

test("unrelated or other-storage events are ignored; invalid external values reset to system", () => {
  const app = mountTheme({ stored: "light", dark: true, loading: false });
  app.storageEvent({ key: "anotherPreference", newValue: "dark" });
  assertChoice(app, "light", "light");
  app.storageEvent({ key: "orbitTheme", newValue: "dark", storageArea: {} });
  assertChoice(app, "light", "light");
  app.storageEvent({ key: "orbitTheme", newValue: "invalid" });
  assertChoice(app, "system", "dark");
});

test("storage denial still allows switching and explains that the preference was not saved", () => {
  const app = mountTheme({ storageDenied: true, dark: true, loading: false });
  assertChoice(app, "system", "dark");
  assert.doesNotThrow(() => app.get("theme-light").dispatch("click"));
  assertChoice(app, "light", "light");
  assert.equal(app.get("theme-menu").hidden, true);
  const notices = app.get("toast-region").children;
  assert.equal(notices.length, 1);
  assert.match(notices[0].textContent, /无法保存设置/);
  assert.equal(app.timers[0].delay, 4500);
  app.timers[0].callback();
  assert.equal(notices[0].removed, true);
  assert.doesNotThrow(() => app.storageEvent({ key: "orbitTheme", newValue: "dark" }));
  assertChoice(app, "light", "light");
});

test("missing media support safely defaults to light and still accepts a dark override", () => {
  const app = mountTheme({ mediaUnavailable: true, loading: false });
  assertChoice(app, "system", "light");
  app.get("theme-dark").dispatch("click");
  assertChoice(app, "dark", "dark");
});

test("menu opens at the selected option, reports expansion, and restores focus on Escape", () => {
  const app = mountTheme({ stored: "dark", loading: false });
  const toggle = app.get("theme-toggle");
  const menu = app.get("theme-menu");
  toggle.dispatch("click");
  assert.equal(menu.hidden, false);
  assert.equal(toggle.getAttribute("aria-expanded"), "true");
  assert.equal(app.document.activeElement, app.get("theme-dark"));
  const event = menu.dispatch("keydown", { key: "Escape" });
  assert.equal(event.defaultPrevented, true);
  assert.equal(event.propagationStopped, true);
  assert.equal(menu.hidden, true);
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.equal(app.document.activeElement, toggle);
});

test("menu keyboard arrows wrap and Home/End focus the first/last choice without changing it", () => {
  const app = mountTheme({ loading: false });
  const toggle = app.get("theme-toggle");
  const menu = app.get("theme-menu");
  const down = toggle.dispatch("keydown", { key: "ArrowDown" });
  assert.equal(down.defaultPrevented, true);
  assert.equal(app.document.activeElement, app.get("theme-system"));
  for (const [key, expected] of [
    ["ArrowUp", "dark"], ["ArrowDown", "system"], ["ArrowDown", "light"],
    ["End", "dark"], ["Home", "system"]
  ]) {
    assert.equal(menu.dispatch("keydown", { key }).defaultPrevented, true);
    assert.equal(app.document.activeElement, app.get(`theme-${expected}`));
    assertChoice(app, "system", "light");
  }
  menu.dispatch("keydown", { key: "Escape" });
  toggle.dispatch("keydown", { key: "ArrowUp" });
  assert.equal(app.document.activeElement, app.get("theme-dark"));
  assert.equal(app.writes.length, 0);
});

test("Tab, outside click, and focus leaving dismiss the menu without trapping focus", () => {
  const app = mountTheme({ loading: false });
  const toggle = app.get("theme-toggle");
  const menu = app.get("theme-menu");
  toggle.dispatch("click");
  const tab = menu.dispatch("keydown", { key: "Tab" });
  assert.equal(tab.defaultPrevented, false);
  assert.equal(menu.hidden, true);
  toggle.dispatch("click");
  app.outsideClick(app.get("theme-icon"));
  assert.equal(menu.hidden, false, "a click inside the control must keep the menu open");
  app.outsideClick();
  assert.equal(menu.hidden, true);
  toggle.dispatch("click");
  app.get("theme-control").dispatch("focusout", { relatedTarget: app.get("theme-light") });
  assert.equal(menu.hidden, false);
  app.get("theme-control").dispatch("focusout", { relatedTarget: null });
  assert.equal(menu.hidden, true);
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
});

test("theme initialization is locally packaged and loaded in the head before styles", async () => {
  const html = await readFile(new URL("../manager.html", import.meta.url), "utf8");
  const packager = await readFile(new URL("../package-extension.mjs", import.meta.url), "utf8");
  const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0];
  assert.ok(head);
  assert.match(head, /<meta name="color-scheme" content="light dark"\s*\/>/);
  const script = head.match(/<script\b[^>]*src="theme\.js"[^>]*><\/script>/)?.[0];
  assert.ok(script, "the theme bootstrap must be a local script in the head");
  assert.doesNotMatch(script, /\b(?:defer|async|type="module")\b/, "theme must initialize before the first paint");
  assert.ok(head.indexOf(script) < head.indexOf('href="tailwind.css"'));
  assert.match(packager, /const runtimeFiles = \[[\s\S]*?"theme\.js"[\s\S]*?\];/);
  assert.match(packager, /for \(const name of \[[^\]]*"theme\.js"[^\]]*\]\) new Script/);
  for (const mode of ["system", "light", "dark"]) {
    assert.match(html, new RegExp(`<button[^>]+id="theme-${mode}"[^>]+role="menuitemradio"[^>]+tabindex="-1"`));
  }
});
