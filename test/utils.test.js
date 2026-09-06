import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyTab,
  findDuplicateTabIds,
  groupableCategories,
  getDisplayHost,
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

test("suite tenant hosts have friendly localized names without losing workspace identity", () => {
  const lark = "https://sample-team.sg.larksuite.com/wiki/document";
  const feishu = "https://team.feishu.cn/docx/document";
  const expected = {
    "zh-CN": ["Lark 云文档", "飞书云文档", "飞书项目"],
    en: ["Lark Docs", "Feishu Docs", "Feishu Project"],
    ko: ["Lark 문서", "Feishu 문서", "Feishu 프로젝트"],
    ja: ["Lark ドキュメント", "Feishu ドキュメント", "Feishu プロジェクト"]
  };
  for (const [locale, names] of Object.entries(expected)) {
    assert.equal(getSiteName(lark, locale), names[0]);
    assert.equal(getSiteName(feishu, locale), names[1]);
    assert.equal(getSiteName("https://project.feishu.cn/team/work-item", locale), names[2]);
    assert.equal(getSiteName("https://project.larksuite.com/team/work-item", locale), "Meegle");
    assert.equal(getSiteName("https://www.okx.com/trade", locale), "OKX");
  }
  assert.equal(getSiteName(lark), "Lark 云文档");
  assert.equal(getSiteName(lark, "ko-KR"), "Lark 문서");
  assert.equal(getSiteName(lark, "ja-JP"), "Lark ドキュメント");
  assert.equal(getSiteName(lark, "unsupported"), "Lark Docs");
  assert.equal(getSiteName("https://www.larksuite.com/", "zh-CN"), "Lark");
  assert.equal(getSiteName("https://www.feishu.cn/", "zh-CN"), "飞书");
  assert.equal(getSiteKey(lark), "host:sample-team.sg.larksuite.com");
  assert.equal(getSiteKey(lark), getSiteKey("https://sample-team.sg.larksuite.com/docx/another"));

  const independentHosts = [
    "https://alpha.sg.larksuite.com/wiki/one", "https://beta.sg.larksuite.com/wiki/two",
    "https://alpha.larksuite.com/wiki/one", "https://alpha.feishu.cn/wiki/one",
    "https://beta.feishu.cn/wiki/two", "https://project.larksuite.com/team/work-item",
    "https://project.feishu.cn/team/work-item", "https://www.larksuite.com/"
  ];
  assert.equal(new Set(independentHosts.map(getSiteKey)).size, independentHosts.length);
});

test("brand matching rejects deceptive suffixes, lookalikes, other protocols, and custom ports", () => {
  const hosts = [
    "larksuite.com.evil.example", "fake-larksuite.com", "project.larksuite.com.evil.example",
    "feishu.cn.evil.example", "fake-feishu.cn", "project.feishu.cn.evil.example",
    "okx.com.evil.example", "fake-okx.com", "okx.com:8443"
  ];
  for (const host of hosts) {
    assert.equal(getSiteName(`https://${host}/`, "zh-CN"), host);
    assert.equal(getSiteKey(`https://${host}/`), `host:${host}`);
  }
  assert.equal(getSiteName("https://larksuite.com@evil.example/wiki"), "evil.example");
  assert.equal(getSiteName("ftp://team.feishu.cn/document"), "team.feishu.cn");
  assert.equal(matchesQuery({ url: "https://okx.com.evil.example/" }, "欧易"), false);
  assert.equal(matchesQuery({ url: "https://team.feishu.cn.evil.example/" }, "飞书云文档"), false);
});

test("generic site labels and display hosts follow the selected language", () => {
  const expected = {
    "zh-CN": ["未命名网站", "浏览器页面", "本地文件", "新标签页"],
    en: ["Unnamed website", "Browser page", "Local file", "New tab"],
    ko: ["이름 없는 웹사이트", "브라우저 페이지", "로컬 파일", "새 탭"],
    ja: ["名前のないサイト", "ブラウザのページ", "ローカルファイル", "新しいタブ"]
  };
  for (const [locale, labels] of Object.entries(expected)) {
    assert.equal(getSiteName("", locale), labels[0]);
    assert.equal(getSiteName("chrome://newtab/", locale), labels[1]);
    assert.equal(getSiteName("about:blank", locale), labels[1]);
    assert.equal(getSiteName("file:///private/example.html", locale), labels[2]);
    assert.equal(getDisplayHost("chrome://newtab/", locale), labels[1]);
    assert.equal(getDisplayHost("file:///private/example.html", locale), labels[2]);
    assert.equal(getDisplayHost("", locale), labels[3]);
    assert.equal(getDisplayHost("https://www.example.com:8443/", locale), "example.com:8443");
  }
  assert.equal(getSiteKey("chrome://newtab/"), "browser");
  assert.equal(getSiteKey("file:///private/example.html"), "local file");
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

test("search matches friendly site labels and aliases across interface languages", () => {
  const lark = { title: "Weekly report", url: "https://team.sg.larksuite.com/wiki/report" };
  for (const locale of ["zh-CN", "en", "ko", "ja"]) {
    for (const alias of ["Lark 云文档", "Lark Docs", "Lark 문서", "Lark ドキュメント"]) {
      assert.equal(matchesQuery(lark, alias, locale), true);
    }
    assert.equal(matchesQuery(lark, "Meegle", locale), false);
    assert.equal(matchesQuery({ url: "https://project.larksuite.com/team/work-item" }, "Meegle", locale), true);
    assert.equal(matchesQuery({ url: "https://project.larksuite.com/team/work-item" }, "Lark Project", locale), true);
    assert.equal(matchesQuery({ url: "https://project.feishu.cn/team/work-item" }, "飞书项目", locale), true);
    assert.equal(matchesQuery({ url: "https://www.okx.com/trade" }, "欧易", locale), true);
  }
  assert.equal(matchesQuery({ url: "chrome://newtab/" }, "브라우저", "ko"), true);
  assert.equal(matchesQuery({ url: "file:///private/example.html" }, "ローカル", "ja"), true);
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
