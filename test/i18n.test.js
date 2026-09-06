import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script, createContext } from "node:vm";

const source = await readFile(new URL("../i18n.js", import.meta.url), "utf8");
const html = await readFile(new URL("../manager.html", import.meta.url), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));

function mount({ languages = ["zh-CN"], language, stored = null, storageDenied = false, writeDenied = false, loading = true } = {}) {
  const globalHandlers = new Map();
  const documentHandlers = new Map();
  const elements = new Map();
  const values = new Map(stored === null ? [] : [["orbitLanguage", stored]]);
  const writes = [];
  const dispatched = [];
  const timers = [];
  const listen = (collection, type, callback) => {
    if (!collection.has(type)) collection.set(type, []);
    collection.get(type).push(callback);
  };
  const emit = (collection, type, event = {}) => {
    for (const handler of collection.get(type) || []) handler({ type, ...event });
  };
  function makeElement(id, attributes = {}, text = "") {
    const handlers = new Map();
    return {
      id, textContent: text, value: "", attributes: { ...attributes }, children: [], removed: false,
      getAttribute(name) { return this.attributes[name] ?? null; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      append(child) { this.children.push(child); },
      remove() { this.removed = true; },
      addEventListener(type, callback) { listen(handlers, type, callback); },
      dispatch(type, event) { emit(handlers, type, { target: this, ...event }); }
    };
  }
  for (const [id, attributes, text] of [
    ["language-select", { "data-i18n-aria-label": "language.label" }],
    ["chinese-option", {}, "中文"], ["english-option", {}, "English"], ["korean-option", {}, "한국어"], ["japanese-option", {}, "日本語"],
    ["search", { "data-i18n-placeholder": "search.placeholder", "data-i18n-aria-label": "search.label" }],
    ["help", { "data-i18n": "help.open", "data-i18n-title": "help.open" }], ["toast-region", {}]
  ]) elements.set(id, makeElement(id, attributes, text));
  const document = {
    documentElement: { lang: "" }, title: "", readyState: loading ? "loading" : "complete",
    getElementById: (id) => document.readyState === "loading" ? null : elements.get(id) || null,
    createElement: () => makeElement("toast"),
    addEventListener: (type, callback) => listen(documentHandlers, type, callback),
    querySelectorAll(selector) {
      const attribute = selector.slice(1, -1);
      return [...elements.values(), ...elements.get("toast-region").children].filter((item) => item.getAttribute(attribute) !== null);
    }
  };
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem(key, value) {
      if (writeDenied) throw new Error("Quota exceeded");
      writes.push([key, value]); values.set(key, value);
    }
  };
  const navigator = { languages, language };
  const context = {
    document, navigator,
    addEventListener: (type, callback) => listen(globalHandlers, type, callback),
    dispatchEvent(event) { dispatched.push(event); emit(globalHandlers, event.type, event); },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    setTimeout(callback, delay) { timers.push({ callback, delay }); }
  };
  Object.defineProperty(context, "localStorage", { get() { if (storageDenied) throw new Error("Denied"); return storage; } });
  new Script(source, { filename: "i18n.js" }).runInContext(createContext(context));
  return {
    api: context.OrbitI18n, document, navigator, writes, dispatched, timers, storage,
    get: (id) => elements.get(id),
    ready() { document.readyState = "complete"; emit(documentHandlers, "DOMContentLoaded"); },
    browserLanguage(languages) { navigator.languages = languages; emit(globalHandlers, "languagechange"); },
    storageEvent(event) { emit(globalHandlers, "storage", { storageArea: storage, ...event }); }
  };
}

test("browser languages resolve regional variants, supported fallback preferences, and unsupported defaults before the body loads", () => {
  for (const [languages, locale] of [
    [["zh-TW"], "zh-CN"], [["zh-HK", "en"], "zh-CN"], [["EN-gb"], "en"], [["ko-KR"], "ko"], [["ja-JP"], "ja"],
    [["fr-FR", "ko-KR", "ja"], "ko"], [["fr-FR"], "en"], [[], "en"]
  ]) {
    const app = mount({ languages });
    assert.equal(app.api.locale, locale);
    assert.equal(app.api.preference, "system");
    assert.equal(app.document.documentElement.lang, locale);
    assert.equal(app.document.title, app.api.t("app.title"));
    assert.deepEqual(app.writes, []);
    assert.equal(app.get("help").textContent, "");
  }
  assert.equal(mount({ languages: [], language: "ja-JP" }).api.locale, "ja");
});

test("valid saved manual languages win; invalid saved values use browser language", () => {
  for (const stored of ["zh-CN", "en", "ko", "ja"]) {
    const app = mount({ languages: ["en-US"], stored });
    assert.equal(app.api.locale, stored);
    assert.equal(app.api.preference, stored);
  }
  for (const stored of [null, "", "system", "invalid", "ZH-CN", "fr", '"ja"']) {
    const app = mount({ languages: ["ko-KR"], stored });
    assert.equal(app.api.locale, "ko");
    assert.equal(app.api.preference, "system");
  }
});

test("language dropdown shows resolved local language with only four explicit choices", () => {
  const select = html.match(/<select id="language-select"[\s\S]*?<\/select>/)[0];
  assert.deepEqual([...select.matchAll(/<option value="([^"]+)"/g)].map((match) => match[1]), ["zh-CN", "en", "ko", "ja"]);
  assert.doesNotMatch(select, /system|自动|跟随浏览器/);
  for (const [language, expected] of [["zh-HK", "zh-CN"], ["en-US", "en"], ["ko-KR", "ko"], ["ja-JP", "ja"], ["fr-FR", "en"]]) {
    const app = mount({ languages: [language], stored: "system", loading: false });
    assert.equal(app.get("language-select").value, expected);
    assert.equal(app.api.preference, "system", "displaying resolved language must not save a manual override");
    assert.deepEqual(app.writes, []);
  }
});

test("DOM-ready initialization translates text, placeholders and accessible labels while keeping native language names", () => {
  const app = mount({ stored: "ja" });
  app.ready();
  assert.equal(app.get("language-select").value, "ja");
  assert.equal(app.get("language-select").getAttribute("aria-label"), "表示言語");
  assert.equal(app.get("search").getAttribute("placeholder"), "サイトやページを検索…");
  assert.equal(app.get("search").getAttribute("aria-label"), "サイトやページを検索");
  assert.equal(app.get("help").textContent, "使い方");
  assert.equal(app.get("help").getAttribute("title"), "使い方");
  assert.deepEqual(["chinese", "english", "korean", "japanese"].map((name) => app.get(name + "-option").textContent), ["中文", "English", "한국어", "日本語"]);
});

test("native selection persists immediately, translates metadata, notifies observers, and supports unsubscribe", () => {
  const app = mount({ loading: false });
  const events = [];
  const unsubscribe = app.api.subscribe((detail) => events.push(plain(detail)));
  app.get("language-select").value = "en";
  app.get("language-select").dispatch("change");
  assert.equal(app.api.locale, "en");
  assert.equal(app.document.title, "Orbit · Tab overview");
  assert.deepEqual(app.writes, [["orbitLanguage", "en"]]);
  assert.deepEqual(events, [{ locale: "en", preference: "en" }]);
  assert.equal(app.dispatched[0].type, "orbit:languagechange");
  assert.deepEqual(plain(app.dispatched[0].detail), events[0]);
  unsubscribe();
  app.api.setLanguage("ja");
  assert.equal(events.length, 1);
  assert.equal(mount({ stored: app.storage.getItem("orbitLanguage") }).api.locale, "ja");
});

test("automatic language tracks browser changes, manual choice does not, and reset resumes tracking", () => {
  const app = mount({ loading: false });
  app.browserLanguage(["ko-KR"]);
  assert.equal(app.api.locale, "ko");
  assert.deepEqual(app.writes, []);
  app.api.setLanguage("ja");
  app.browserLanguage(["en-US"]);
  assert.equal(app.api.locale, "ja");
  app.api.setLanguage("system");
  assert.equal(app.api.locale, "en");
  app.browserLanguage(["zh-HK"]);
  assert.equal(app.api.locale, "zh-CN");
  assert.equal(app.get("language-select").value, "zh-CN");
  assert.deepEqual(app.writes, [["orbitLanguage", "ja"], ["orbitLanguage", "system"]]);
});

test("cross-tab storage changes translate immediately without feedback writes and removal returns to automatic", () => {
  const app = mount({ languages: ["ja-JP"], stored: "en", loading: false });
  app.storageEvent({ key: "orbitLanguage", newValue: "ko" });
  assert.equal(app.api.locale, "ko");
  assert.equal(app.get("help").textContent, "사용 안내");
  app.storageEvent({ key: "orbitLanguage", newValue: null });
  assert.equal(app.api.preference, "system");
  assert.equal(app.api.locale, "ja");
  app.storageEvent({ key: "orbitLanguage", newValue: "zh-CN" });
  app.storageEvent({ key: null, newValue: null });
  assert.equal(app.api.locale, "ja");
  assert.deepEqual(app.writes, []);
});

test("unrelated storage areas and keys are ignored; invalid external values fall back safely", () => {
  const app = mount({ stored: "en", loading: false });
  app.storageEvent({ key: "orbitTheme", newValue: "ko" });
  app.storageEvent({ key: "orbitLanguage", newValue: "ko", storageArea: {} });
  assert.equal(app.api.locale, "en");
  app.storageEvent({ key: "orbitLanguage", newValue: "invalid" });
  assert.equal(app.api.locale, "zh-CN");
  assert.equal(app.api.preference, "system");
});

test("denied storage does not block language changes and shows a translated nonpersistent-choice notice", () => {
  const app = mount({ storageDenied: true, loading: false });
  assert.equal(app.api.locale, "zh-CN");
  assert.equal(app.api.setLanguage("ko"), false);
  assert.equal(app.api.locale, "ko");
  const toast = app.get("toast-region").children[0];
  assert.equal(toast.textContent, app.api.t("language.saveError"));
  assert.match(toast.textContent, /저장하지 못했습니다/);
  app.api.setLanguage("en");
  assert.equal(toast.textContent, app.api.t("language.saveError"), "an existing notice changes language too");
  app.storageEvent({ key: "orbitLanguage", newValue: "ja" });
  assert.equal(app.api.locale, "en");
  assert.equal(app.timers[0].delay, 4500);
  app.timers[0].callback();
  assert.equal(toast.removed, true);
});

test("write-only failure preserves prior saved choice and a pre-DOM notice appears after initialization", () => {
  const app = mount({ stored: "en", writeDenied: true });
  assert.equal(app.api.setLanguage("ja"), false);
  assert.equal(app.api.locale, "ja");
  assert.equal(app.storage.getItem("orbitLanguage"), "en");
  app.ready();
  assert.equal(app.get("toast-region").children.length, 1);
  assert.equal(app.get("toast-region").children[0].textContent, app.api.t("language.saveError"));
});

test("all four catalogs have identical complete keys and interpolation placeholders, including every static HTML key", () => {
  const app = mount();
  const catalogs = app.api.catalogs;
  const keys = Object.keys(catalogs.en).sort();
  const placeholders = (value) => [...new Set(value.match(/\{\w+\}/g) || [])].sort();
  assert.deepEqual(plain(app.api.supportedLocales).sort(), ["en", "ja", "ko", "zh-CN"]);
  for (const [locale, catalog] of Object.entries(catalogs)) {
    assert.deepEqual(Object.keys(catalog).sort(), keys, locale);
    for (const key of keys) {
      assert.equal(typeof catalog[key], "string", locale + ": " + key);
      assert.ok(catalog[key].trim(), locale + ": empty " + key);
      assert.deepEqual(placeholders(catalog[key]), placeholders(catalogs.en[key]), locale + ": placeholders " + key);
    }
  }
  for (const [, key] of html.matchAll(/data-i18n(?:-placeholder|-aria-label|-title)?="([^"]+)"/g)) assert.ok(keys.includes(key), key);
});

test("interpolation, English singular counts, unknown-key fallback, and time-specific warm greetings work in all locales", () => {
  const app = mount({ stored: "en", loading: false });
  assert.equal(app.api.t("summary.tabs", { count: 1 }), "1 tab");
  assert.equal(app.api.t("summary.tabs", { count: 2 }), "2 tabs");
  assert.equal(app.api.t("summary.tabs", { count: "<strong>1</strong>", _count: 1 }), "<strong>1</strong> tab");
  assert.equal(app.api.t("theme.toggle", { mode: "Dark mode" }), "Change appearance, current: Dark mode");
  assert.equal(app.api.t("unknown.key"), "unknown.key");
  for (const locale of app.api.supportedLocales) {
    app.api.setLanguage(locale);
    const notes = ["night", "morning", "noon", "afternoon", "evening"].map((period) => app.api.t("greeting." + period + "Note"));
    assert.equal(new Set(notes).size, 5, locale);
    assert.ok(notes.every((text) => !text.includes("greeting.")), locale);
  }
});
