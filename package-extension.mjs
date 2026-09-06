import { execFileSync } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";

const root = fileURLToPath(new URL(".", import.meta.url));
const runtimeFiles = [
  "manifest.json",
  "background.js",
  "manager.html",
  "manager.bundle.js",
  "tailwind.css",
  "assets/orbit-icon.png",
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "PRIVACY.md"
];
const files = new Map(await Promise.all(runtimeFiles.map(async (name) => [name, await readFile(path.join(root, name))])));
const manifest = JSON.parse(files.get("manifest.json").toString());
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
if (manifest.manifest_version !== 3 || !/^\d+(?:\.\d+){0,3}$/.test(manifest.version) || manifest.version !== pkg.version) {
  throw new Error("扩展版本必须有效，并与 package.json 一致。");
}

// Check every entry point before creating a distributable directory.
const entryPoints = [manifest.background?.service_worker, ...Object.values(manifest.icons || {})];
if (typeof manifest.action?.default_icon === "string") entryPoints.push(manifest.action.default_icon);
else entryPoints.push(...Object.values(manifest.action?.default_icon || {}));
for (const match of files.get("manager.html").toString().matchAll(/(?:src|href)="([^"]+)"/g)) entryPoints.push(match[1]);
for (const name of entryPoints) {
  if (!name || !files.has(name)) throw new Error(`入口文件不在发布白名单中：${name}`);
}
for (const name of ["background.js", "manager.bundle.js"]) new Script(files.get(name).toString(), { filename: name });
files.set("INSTALL.txt", Buffer.from(`Orbit ${manifest.version} · Chrome 选项卡总览\n\n1. 解压 ZIP 后保留整个文件夹（不要双击 manager.html 安装）。\n2. 在 Chrome 地址栏打开 chrome://extensions，开启右上角“开发者模式”。\n3. 点击“加载已解压的扩展程序”，选择包含 manifest.json 的这个文件夹。\n4. 点击浏览器工具栏的拼图图标，将 Orbit 固定；之后点击 Orbit 即可汇总真实选项卡。\n\n快捷键：Mac 为 Command + Shift + 0；Windows 为 Ctrl + Shift + 0。\n更新：替换同一扩展目录的文件后，在 chrome://extensions 中点击 Orbit 的刷新按钮。\n请勿删除或移动已加载的文件夹。无需发布、服务器或账号。\n`));

const dist = path.join(root, "dist");
const unpacked = path.join(dist, "Orbit");
const archive = path.join(dist, `orbit-${manifest.version}.zip`);

async function ensureDirectory(directory) {
  try {
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`发布目录必须是普通文件夹：${directory}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await mkdir(directory);
  }
}

async function checkExistingDirectory(directory, prefix = "") {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (name === "assets" && entry.isDirectory()) {
      await checkExistingDirectory(path.join(directory, entry.name), "assets/");
    } else if (!entry.isFile() || !files.has(name)) {
      throw new Error(`发布目录含有非生成文件，已停止以保护文件：${path.join(directory, entry.name)}`);
    }
  }
}

await ensureDirectory(dist);
await ensureDirectory(unpacked);
await checkExistingDirectory(unpacked);
await ensureDirectory(path.join(unpacked, "assets"));
try {
  const info = await lstat(archive);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`ZIP 目标不是普通文件：${archive}`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

for (const [name, content] of files) await writeFile(path.join(unpacked, name), content);
const temporaryDirectory = await mkdtemp(path.join(dist, ".orbit-package-"));
const temporaryArchive = path.join(temporaryDirectory, "orbit.zip");
try {
  execFileSync("zip", ["-q", "-X", temporaryArchive, ...files.keys()], { cwd: unpacked, stdio: "inherit" });
  execFileSync("unzip", ["-tq", temporaryArchive], { stdio: "inherit" });
  await rename(temporaryArchive, archive);
} finally {
  await unlink(temporaryArchive).catch((error) => { if (error.code !== "ENOENT") throw error; });
  await rmdir(temporaryDirectory);
}
console.log(`可直接加载的扩展文件夹：${unpacked}`);
console.log(`可分享的扩展压缩包：${archive}`);
console.log(`已验证 ${runtimeFiles.length} 个扩展与许可文件及中文安装说明；未打包源码、依赖或预览截图。`);
