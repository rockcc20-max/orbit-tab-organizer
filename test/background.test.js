import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

test("first install opens Orbit without unused Chrome storage access", async () => {
  let installed;
  const created = [];
  const chrome = {
    runtime: { getURL: (path) => `chrome-extension://test/${path}`, onInstalled: { addListener: (handler) => { installed = handler; } } },
    action: { onClicked: { addListener() {} } },
    commands: { onCommand: { addListener() {} } },
    tabs: { query: async () => [], create: async (options) => created.push(options.url) }
  };
  runInNewContext(await readFile(new URL("../background.js", import.meta.url), "utf8"), { chrome });
  await installed({ reason: "install" });
  assert.deepEqual(created, ["chrome-extension://test/manager.html"]);
  await installed({ reason: "update" });
  assert.equal(created.length, 1, "updating the extension should not create an extra manager tab");
});
