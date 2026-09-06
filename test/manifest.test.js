import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("manifest is valid and all declared entry files exist", async () => {
  const manifest = JSON.parse(await readFile(resolve(projectRoot, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.permissions.includes("tabs"));
  assert.ok(manifest.permissions.includes("storage"));
  assert.ok(manifest.permissions.includes("favicon"), "local website logos need the Chrome favicon permission");

  const declaredFiles = [
    manifest.background.service_worker,
    manifest.action.default_icon,
    "tailwind.css",
    ...Object.values(manifest.icons)
  ];
  await Promise.all([...new Set(declaredFiles)].map((file) => access(resolve(projectRoot, file))));

  const managerHtml = await readFile(resolve(projectRoot, "manager.html"), "utf8");
  assert.match(managerHtml, /href="tailwind\.css"/);
  assert.match(managerHtml, /<script src="manager\.bundle\.js" defer><\/script>/);
  assert.doesNotMatch(managerHtml, /<script[^>]+src="https?:/, "extension scripts must be packaged locally");
  await access(resolve(projectRoot, "manager.bundle.js"));
});
