import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyTab,
  findDuplicateTabIds,
  groupableCategories,
  getSiteKey,
  getSiteName,
  isOrbitUrl,
  matchesQuery,
  normalizeUrl
} from "../utils.js";

test("duplicate identity preserves routes, business parameters, and address differences", () => {
  assert.equal(
    normalizeUrl("https://www.example.com/story/?utm_source=x&id=8&ref=account&source=project#details"),
    "https://www.example.com/story/?utm_source=x&id=8&ref=account&source=project#details"
  );
  assert.equal(normalizeUrl("https://EXAMPLE.com:443"), "https://example.com/");
  const addresses = [
    "https://example.com/project",
    "https://example.com/project/",
    "https://www.example.com/project",
    "https://example.com/project#one",
    "https://example.com/project#two",
    "https://example.com/project?ref=one",
    "https://example.com/project?ref=two",
    "https://example.com/project?source=one",
    "https://example.com/project?source=two",
    "https://example.com/project?utm_source=one"
  ];
  assert.equal(new Set(addresses.map(normalizeUrl)).size, addresses.length);
  assert.deepEqual(findDuplicateTabIds(addresses.map((url, id) => ({ id, url }))), []);
});

test("site names are friendly and recognizable", () => {
  assert.equal(getSiteName("https://www.youtube.com/watch?v=1"), "YouTube");
  assert.equal(getSiteName("https://gemini.google.com/app"), "Gemini");
  assert.equal(getSiteName("https://app.example-product.com/home"), "app.example-product.com");
  assert.equal(getSiteKey("https://m.youtube.com/watch?v=1"), "youtube");
  assert.equal(getSiteKey("https://youtu.be/1"), "youtube");
  assert.equal(getSiteKey("https://app.slack.com/client/a"), getSiteKey("https://slack.com/home"));
  assert.equal(getSiteKey("https://chat.openai.com/"), getSiteKey("https://chatgpt.com/"));
});

test("Google products remain separate while Gmail aliases share a site", () => {
  const sites = ["gemini.google.com", "docs.google.com", "drive.google.com", "mail.google.com", "google.com"];
  assert.equal(new Set(sites.map((host) => getSiteKey(`https://${host}/`))).size, sites.length);
  assert.equal(getSiteKey("https://gmail.com/"), getSiteKey("https://mail.google.com/"));
});

test("unknown hosted sites, public suffixes, IP addresses, and development ports remain distinct", () => {
  const sites = [
    "https://alice.github.io/", "https://bob.github.io/",
    "https://alpha.co.uk/", "https://beta.co.uk/",
    "https://app.example.com/", "https://shop.example.com/",
    "http://10.1.0.1/", "http://10.2.0.1/",
    "http://localhost:3000/", "http://localhost:4000/",
    "http://127.0.0.1:3000/", "http://127.0.0.1:4000/",
    "http://[::1]:3000/", "http://[::1]:4000/",
    "https://youtube.com.evil.example/", "https://youtube.com:8443/", "https://youtube.com/"
  ];
  assert.equal(new Set(sites.map(getSiteKey)).size, sites.length);
  assert.equal(getSiteName("http://localhost:3000/"), "localhost:3000");
  assert.equal(getSiteKey("https://alice.github.io/a"), getSiteKey("https://alice.github.io/b"));
});

test("duplicate cleanup protects fixed, active, playing, and loading tabs", () => {
  const tabs = [
    { id: 1, url: "https://example.com?a=1", lastAccessed: 10 },
    { id: 2, url: "https://example.com?a=1", pinned: true, lastAccessed: 2 },
    { id: 3, url: "https://example.com?a=1", active: true, lastAccessed: 20 },
    { id: 4, url: "https://example.com?a=1", audible: true, lastAccessed: 5 },
    { id: 5, url: "https://example.com?a=1", status: "loading", lastAccessed: 8 }
  ];
  assert.deepEqual(findDuplicateTabIds(tabs), [1]);
  assert.deepEqual(findDuplicateTabIds(tabs.slice(1)), []);
});

test("duplicate cleanup keeps the newest available tab and does not reorder input", () => {
  const tabs = [
    { id: 1, url: "https://example.com", lastAccessed: 10 },
    { id: 2, url: "https://example.com/", lastAccessed: 30 },
    { id: 3, url: "https://example.com/", lastAccessed: 20 }
  ];
  assert.deepEqual(findDuplicateTabIds(tabs).sort((a, b) => a - b), [1, 3]);
  assert.deepEqual(tabs.map((tab) => tab.id), [1, 2, 3]);
});

test("duplicate cleanup does not merge privacy sessions or a tab navigating elsewhere", () => {
  const tabs = [
    { id: 1, url: "https://example.com/" },
    { id: 2, url: "https://example.com/", incognito: true },
    { id: 3, url: "https://example.com/", cookieStoreId: "work" },
    { id: 4, url: "https://example.com/", pendingUrl: "https://example.com/another-page" }
  ];
  assert.deepEqual(findDuplicateTabIds(tabs), []);
});

test("only the exact Orbit manager origin and path are excluded", () => {
  const manager = "chrome-extension://orbit-id/manager.html";
  assert.equal(isOrbitUrl(`${manager}?demo=1#top`, manager), true);
  assert.equal(isOrbitUrl("chrome-extension://other-id/manager.html", manager), false);
  assert.equal(isOrbitUrl("https://example.com/manager.html", manager), false);
  assert.equal(isOrbitUrl("https://example.com/admin/manager.html"), false);
  assert.equal(isOrbitUrl("file:///work/manager.html", "file:///orbit/manager.html"), false);
  assert.equal(isOrbitUrl("http://localhost:3000/manager.html", "http://localhost:4000/manager.html"), false);
  assert.equal(isOrbitUrl("file:///orbit/manager.html?demo=1", "file:///orbit/manager.html"), true);

  assert.deepEqual(findDuplicateTabIds([
    { id: 1, url: "https://example.com/manager.html", lastAccessed: 10 },
    { id: 2, url: "https://example.com/manager.html", lastAccessed: 20 }
  ]), [1]);
});

test("search matches title, URL, and hostname", () => {
  const tab = { title: "Quarterly research", url: "https://notion.so/workspace" };
  assert.equal(matchesQuery(tab, "quarter"), true);
  assert.equal(matchesQuery(tab, "notion"), true);
  assert.equal(matchesQuery(tab, "youtube"), false);
});

test("tab categories support smart grouping", () => {
  assert.equal(classifyTab({ url: "https://github.com/openai", title: "Repo" }).key, "build");
  assert.equal(classifyTab({ url: "https://gemini.google.com/app", title: "Gemini" }).key, "ai");
  assert.equal(classifyTab({ url: "https://docs.google.com/document/d/1", title: "Plan" }).key, "docs");
  assert.equal(classifyTab({ url: "https://figma.com/design/1", title: "Prototype" }).key, "design");
  const groups = groupableCategories([
    { id: 1, url: "https://github.com/a" },
    { id: 2, url: "https://stackoverflow.com/questions" },
    { id: 3, url: "https://youtube.com/watch?v=1" }
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].key, "build");
});
