import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script, createContext } from "node:vm";

const themeSource = await readFile(new URL("../theme.js", import.meta.url), "utf8");

function mountTheme({ stored = null, dark = false, storageDenied = false, writeDenied = false, mediaUnavailable = false, loading = true, i18n = null, missingIcon = false } = {}) {
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
    for (const callback of collection.get(type) || []) callback(detail);
  }

  function makeElement(id) {
    const listeners = new Map();
    const attributes = new Map();
    return {
      id, dataset: {}, textContent: "", innerHTML: "", title: "", children: [], removed: false,
      addEventListener(type, callback) { listen(listeners, type, callback); },
      dispatch(type, detail = {}) { emit(listeners, type, { target: this, ...detail }); },
      listenerTypes() { return [...listeners.keys()]; },
      setAttribute(name, value) { attributes.set(name, String(value)); },
      getAttribute(name) { return attributes.get(name) ?? null; },
      append(child) { this.children.push(child); },
      remove() { this.removed = true; }
    };
  }

  const root = makeElement("html");
  const colorMeta = makeElement("theme-color");
  for (const id of ["theme-toggle", "theme-icon", "toast-region"]) elements.set(id, makeElement(id));
  if (missingIcon) elements.delete("theme-icon");
  const get = (id) => elements.get(id);
  if (!missingIcon) get("theme-toggle").append(get("theme-icon"));
  const document = {
    documentElement: root,
    readyState: loading ? "loading" : "complete",
    getElementById(id) { return this.readyState === "loading" ? null : get(id) ?? null; },
    querySelector(selector) { return selector === 'meta[name="theme-color"]' ? colorMeta : null; },
    addEventListener(type, callback) { listen(documentListeners, type, callback); },
    createElement(tagName) { return makeElement(tagName); }
  };
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) {
      if (writeDenied) throw new Error("Storage quota exceeded");
      writes.push([key, value]);
      values.set(key, value);
    }
  };
  const media = { matches: dark, addEventListener(type, callback) { listen(mediaListeners, type, callback); } };
  const context = {
    document,
    OrbitI18n: i18n,
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
    root, colorMeta, get, storage, writes, timers,
    ready() {
      if (document.readyState !== "loading") return;
      document.readyState = "complete";
      emit(documentListeners, "DOMContentLoaded");
    },
    setSystemDark(matches) { media.matches = matches; emit(mediaListeners, "change", { matches }); },
    storageEvent(detail) { emit(globalListeners, "storage", { storageArea: storage, ...detail }); },
    languageChange(detail = {}) { emit(globalListeners, "orbit:languagechange", { detail }); }
  };
}

function assertChoice(app, preference, resolved) {
  assert.equal(app.root.dataset.themePreference, preference);
  assert.equal(app.root.dataset.theme, resolved);
  assert.equal(app.colorMeta.getAttribute("content"), resolved === "dark" ? "#171b1a" : "#f7f8fa");
  assert.match(app.get("theme-icon").innerHTML, resolved === "dark" ? /M20\.5 13/ : /<circle/);
  assert.equal(app.get("theme-toggle").getAttribute("aria-haspopup"), null);
  assert.equal(app.get("theme-toggle").getAttribute("aria-expanded"), null);
}

test("theme follows browser before controls exist and the icon reflects the resolved mode", () => {
  for (const dark of [false, true]) {
    const app = mountTheme({ dark });
    assert.equal(app.root.dataset.theme, dark ? "dark" : "light");
    assert.equal(app.root.dataset.themePreference, "system");
    assert.equal(app.get("theme-icon").innerHTML, "");
    assert.deepEqual(app.writes, [], "initialization must not persist the resolved browser mode");
    app.ready();
    assertChoice(app, "system", dark ? "dark" : "light");
    const nextAction = dark ? "切换到白天模式" : "切换到暗色模式";
    assert.equal(app.get("theme-toggle").getAttribute("aria-label"), nextAction);
    assert.equal(app.get("theme-toggle").title, nextAction);
  }
});

test("saved manual preferences still win before the first paint", () => {
  for (const stored of ["light", "dark"]) {
    const app = mountTheme({ stored, dark: stored === "light" });
    assert.equal(app.root.dataset.theme, stored);
    assert.equal(app.root.dataset.themePreference, stored);
    app.ready();
    assertChoice(app, stored, stored);
    assert.deepEqual(app.writes, []);
  }
});

test("invalid saved preferences fall back to the current browser setting", () => {
  for (const stored of ["", "unknown", "DARK", '"dark"']) {
    assertChoice(mountTheme({ stored, dark: true, loading: false }), "system", "dark");
  }
});

test("system preference follows live changes and refreshes the icon and next action", () => {
  const app = mountTheme({ stored: "system", loading: false });
  for (const dark of [false, true, false]) {
    app.setSystemDark(dark);
    assertChoice(app, "system", dark ? "dark" : "light");
    assert.equal(app.get("theme-toggle").title, dark ? "切换到白天模式" : "切换到暗色模式");
  }
  assert.deepEqual(app.writes, []);
});

test("one click flips the resolved browser mode and persists an explicit preference", () => {
  for (const dark of [false, true]) {
    const app = mountTheme({ dark, loading: false });
    const next = dark ? "light" : "dark";
    app.get("theme-toggle").dispatch("click");
    assertChoice(app, next, next);
    assert.deepEqual(app.writes, [["orbitTheme", next]]);
    app.setSystemDark(!dark);
    app.setSystemDark(dark);
    assertChoice(app, next, next);
    assertChoice(mountTheme({ stored: app.storage.getItem("orbitTheme"), dark, loading: false }), next, next);
  }
});

test("repeated clicks switch directly between light and dark without a menu or system step", () => {
  const app = mountTheme({ stored: "light", dark: true, loading: false });
  for (const next of ["dark", "light", "dark"]) {
    app.get("theme-toggle").dispatch("click");
    assertChoice(app, next, next);
  }
  assert.deepEqual(app.writes, [["orbitTheme", "dark"], ["orbitTheme", "light"], ["orbitTheme", "dark"]]);
  assert.deepEqual(app.get("theme-toggle").listenerTypes(), ["click"], "native button activation must not be doubled by custom keyboard handlers");
  assert.equal(app.get("theme-toggle").children.length, 1, "the control contains only its icon");
  assert.equal(app.get("theme-menu"), undefined);
});

test("storage events sync other pages and clearing storage restores live system tracking", () => {
  const app = mountTheme({ stored: "light", dark: true, loading: false });
  for (const mode of ["dark", "light"]) {
    app.storageEvent({ key: "orbitTheme", newValue: mode });
    assertChoice(app, mode, mode);
  }
  app.storageEvent({ key: "orbitTheme", newValue: null });
  assertChoice(app, "system", "dark");
  app.setSystemDark(false);
  assertChoice(app, "system", "light");
  app.storageEvent({ key: "orbitTheme", newValue: "dark" });
  app.storageEvent({ key: null, newValue: null });
  assertChoice(app, "system", "light");
  assert.deepEqual(app.writes, [], "synchronization must not create a storage feedback loop");
});

test("unrelated or other-storage events are ignored; invalid values restore system", () => {
  const app = mountTheme({ stored: "light", dark: true, loading: false });
  app.storageEvent({ key: "orbitLanguage", newValue: "dark" });
  assertChoice(app, "light", "light");
  app.storageEvent({ key: "orbitTheme", newValue: "dark", storageArea: {} });
  assertChoice(app, "light", "light");
  app.storageEvent({ key: "orbitTheme", newValue: "invalid" });
  assertChoice(app, "system", "dark");
});

test("storage denial still switches immediately and reports the unsaved preference", () => {
  const app = mountTheme({ storageDenied: true, dark: true, loading: false });
  assertChoice(app, "system", "dark");
  assert.doesNotThrow(() => app.get("theme-toggle").dispatch("click"));
  assertChoice(app, "light", "light");
  const [notice] = app.get("toast-region").children;
  assert.match(notice.textContent, /无法保存设置/);
  assert.equal(notice.getAttribute("data-i18n"), "theme.saveError");
  assert.equal(app.timers[0].delay, 4500);
  app.timers[0].callback();
  assert.equal(notice.removed, true);
  assert.doesNotThrow(() => app.storageEvent({ key: "orbitTheme", newValue: "dark" }));
  assertChoice(app, "light", "light");
});

test("failed writes preserve an existing saved preference while the open page still switches", () => {
  const app = mountTheme({ stored: "dark", writeDenied: true, loading: false });
  app.get("theme-toggle").dispatch("click");
  assertChoice(app, "light", "light");
  assert.equal(app.storage.getItem("orbitTheme"), "dark");
  assert.equal(app.get("toast-region").children.length, 1);
  app.setSystemDark(true);
  assertChoice(app, "light", "light");
});

const localizedThemeMessages = {
  en: {
    "theme.switchToLight": "Switch to light mode", "theme.switchToDark": "Switch to dark mode",
    "theme.saveError": "Appearance changed, but this browser could not save your preference."
  },
  ko: {
    "theme.switchToLight": "라이트 모드로 전환", "theme.switchToDark": "다크 모드로 전환",
    "theme.saveError": "화면 모드가 변경되었지만 브라우저에 설정을 저장할 수 없습니다."
  },
  ja: {
    "theme.switchToLight": "ライトモードに切り替え", "theme.switchToDark": "ダークモードに切り替え",
    "theme.saveError": "表示モードを変更しましたが、このブラウザでは設定を保存できません。"
  }
};

function makeI18n(locale = "en") {
  return { locale, t(key) { return localizedThemeMessages[this.locale]?.[key] ?? key; } };
}

test("language changes translate the next-action label without changing theme or icon", () => {
  for (const stored of ["light", "dark"]) {
    const i18n = makeI18n();
    const app = mountTheme({ stored, loading: false, i18n });
    const originalIcon = app.get("theme-icon").innerHTML;
    for (const locale of ["en", "ko", "ja"]) {
      i18n.locale = locale;
      app.languageChange({ locale, preference: locale });
      assertChoice(app, stored, stored);
      const nextAction = i18n.t(stored === "dark" ? "theme.switchToLight" : "theme.switchToDark");
      assert.equal(app.get("theme-toggle").getAttribute("aria-label"), nextAction);
      assert.equal(app.get("theme-toggle").title, nextAction);
      assert.equal(app.get("theme-icon").innerHTML, originalIcon);
    }
    assert.deepEqual(app.writes, []);
  }
});

test("storage errors use the selected language and retain a dynamic translation key", () => {
  for (const locale of ["en", "ko", "ja"]) {
    const i18n = makeI18n(locale);
    const app = mountTheme({ storageDenied: true, loading: false, i18n });
    app.get("theme-toggle").dispatch("click");
    assertChoice(app, "dark", "dark");
    const [notice] = app.get("toast-region").children;
    assert.equal(notice.textContent, i18n.t("theme.saveError"));
    assert.equal(notice.getAttribute("data-i18n"), "theme.saveError");
  }
});

test("next-action labels fall back to Chinese when the translation key is unavailable", () => {
  const app = mountTheme({ loading: false, i18n: { t: (key) => key } });
  assert.equal(app.get("theme-toggle").title, "切换到暗色模式");
  app.get("theme-toggle").dispatch("click");
  assert.equal(app.get("theme-toggle").getAttribute("aria-label"), "切换到白天模式");
});

test("missing media support safely defaults to light and still accepts a dark override", () => {
  const app = mountTheme({ mediaUnavailable: true, loading: false });
  assertChoice(app, "system", "light");
  app.get("theme-toggle").dispatch("click");
  assertChoice(app, "dark", "dark");
});

test("missing optional controls do not break the early theme bootstrap", () => {
  const app = mountTheme({ missingIcon: true, stored: "dark", loading: false });
  assert.equal(app.root.dataset.theme, "dark");
  assert.deepEqual(app.get("theme-toggle").listenerTypes(), []);
});

test("a locally packaged pre-paint bootstrap powers a single native icon button", async () => {
  const html = await readFile(new URL("../manager.html", import.meta.url), "utf8");
  const packager = await readFile(new URL("../package-extension.mjs", import.meta.url), "utf8");
  const head = html.match(/<head>[\s\S]*?<\/head>/)?.[0];
  assert.ok(head);
  assert.match(head, /<meta name="color-scheme" content="light dark"\s*\/>/);
  const script = head.match(/<script\b[^>]*src="theme\.js"[^>]*><\/script>/)?.[0];
  assert.ok(script);
  assert.doesNotMatch(script, /\b(?:defer|async|type="module")\b/);
  assert.ok(head.indexOf(script) < head.indexOf('href="tailwind.css"'));
  assert.match(packager, /const runtimeFiles = \[[\s\S]*?"theme\.js"[\s\S]*?\];/);
  assert.match(packager, /for \(const name of \[[^\]]*"theme\.js"[^\]]*\]\) new Script/);
  const toggle = html.match(/<button\b[^>]*id="theme-toggle"[^>]*>[\s\S]*?<\/button>/)?.[0];
  assert.ok(toggle);
  assert.match(toggle, /type="button"/);
  assert.match(toggle, /<svg\b[^>]*id="theme-icon"/);
  assert.doesNotMatch(toggle, /<span|aria-haspopup|aria-expanded|aria-controls/);
  assert.doesNotMatch(html, /id="theme-(?:menu|label|control|system|light|dark)"/);
});
