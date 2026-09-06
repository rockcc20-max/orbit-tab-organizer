import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("public documentation and runtime contain no personal home-directory paths", async () => {
  for (const file of ["README.md", "manager.js", "manager.bundle.js", "i18n.js"]) {
    const content = await readFile(new URL(file, root), "utf8");
    assert.doesNotMatch(content, /\/Users\/[^/\s]+\/|[A-Z]:\\Users\\/i, file);
  }
});

test("public repository excludes local screenshots, archives, and authentication files", async () => {
  const ignored = (await readFile(new URL(".gitignore", root), "utf8")).split(/\r?\n/);
  for (const entry of ["node_modules/", "dist/", "*.zip", "orbit-preview.png", "orbit-sites-preview.png", ".env", ".env.*", ".github-publish/"]) {
    assert.ok(ignored.includes(entry), `${entry} must stay local`);
  }
});

test("open-source package includes the license, third-party notices, and privacy information", async () => {
  const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  assert.equal(pkg.license, "MIT");
  const packager = await readFile(new URL("package-extension.mjs", root), "utf8");
  for (const file of ["LICENSE", "THIRD_PARTY_NOTICES.md", "PRIVACY.md", "i18n.js"]) {
    assert.ok((await readFile(new URL(file, root), "utf8")).trim().length > 0, file);
    assert.ok(packager.includes(`"${file}"`), `${file} must be packaged`);
  }
});
