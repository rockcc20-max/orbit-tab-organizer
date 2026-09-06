import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("toolbar presents filters and sorting before search in visual and keyboard order", async () => {
  const html = await source("manager.html");
  const toolbar = html.slice(html.indexOf('<div class="toolbar">'), html.indexOf('<div id="selection-bar"'));
  assert.ok(toolbar.indexOf('id="all-filter"') < toolbar.indexOf('id="site-sort"'));
  assert.ok(toolbar.indexOf('id="site-sort"') < toolbar.indexOf('id="global-search"'));
  assert.equal((toolbar.match(/id="global-search"/g) || []).length, 1);
  assert.match(html, /aria-label="筛选标签页"/);
  assert.match(html, /data-i18n="filters.duplicates">重复标签页<\/span>/);
  assert.match(html, />按标签页数量</);
});

test("public copy consistently uses 标签页 instead of the former Chinese tab label", async () => {
  for (const file of ["manager.html", "manager.js", "manager.bundle.js", "manifest.json", "package-extension.mjs", "PRIVACY.md", "README.md"]) {
    assert.doesNotMatch(await source(file), /选项卡/, `${file} must use 标签页 in its product copy`);
  }
});
