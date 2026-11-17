#!/usr/bin/env node
// 把版本号同步到 npm / Tauri / Cargo 的清单文件。
// 用法: node scripts/set-version.mjs 0.2.0

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2];

const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
if (!version || !SEMVER.test(version)) {
  console.error("用法: node scripts/set-version.mjs <version>，例如 0.2.0");
  process.exit(1);
}

function writeJson(relativePath, mutate) {
  const path = join(root, relativePath);
  const raw = readFileSync(path, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const data = JSON.parse(raw);
  mutate(data);
  const next = JSON.stringify(data, null, 2).replace(/\n/g, eol) + eol;
  // 只在内容真正变化时写入，避免改动 mtime 引发无谓的构建/编辑器刷新
  if (next === raw) {
    console.log(`unchanged ${relativePath}`);
    return;
  }
  writeFileSync(path, next);
  console.log(`updated ${relativePath} -> ${version}`);
}

// 按行改写，保持原有换行符（避免在 Windows 上把整个文件改成 LF）
function updateLines(relativePath, update) {
  const path = join(root, relativePath);
  const raw = readFileSync(path, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw.split(eol);
  if (!update(lines)) {
    console.error(`${relativePath} 中找不到目标字段，未修改`);
    process.exit(1);
  }
  const next = lines.join(eol);
  if (next === raw) {
    console.log(`unchanged ${relativePath}`);
    return;
  }
  writeFileSync(path, next);
  console.log(`updated ${relativePath} -> ${version}`);
}

writeJson("package.json", (pkg) => {
  pkg.version = version;
});

writeJson("package-lock.json", (lock) => {
  lock.version = version;
  if (lock.packages?.[""]) lock.packages[""].version = version;
});

writeJson("src-tauri/tauri.conf.json", (conf) => {
  conf.version = version;
});

// Cargo.toml 只改 [package] 段里的 version，避免误伤依赖的版本号
updateLines("src-tauri/Cargo.toml", (lines) => {
  let inPackage = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("[")) {
      inPackage = line === "[package]";
      continue;
    }
    if (inPackage && /^version\s*=/.test(line)) {
      lines[i] = `version = "${version}"`;
      return true;
    }
  }
  return false;
});

// Cargo.lock 中本包条目同步更新，避免锁文件产生无关 diff
updateLines("src-tauri/Cargo.lock", (lines) => {
  let inBlock = false;
  let isMinion = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("[[package]]")) {
      inBlock = true;
      isMinion = false;
      continue;
    }
    if (!inBlock) continue;
    if (line.startsWith("name = ")) {
      isMinion = line === 'name = "minion"';
      continue;
    }
    if (isMinion && line.startsWith("version = ")) {
      lines[i] = `version = "${version}"`;
      return true;
    }
  }
  return false;
});
