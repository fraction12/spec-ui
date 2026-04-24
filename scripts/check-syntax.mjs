#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const roots = ["bin", "scripts", "src", "test"].filter(Boolean);
const files = [];

async function collect(path) {
  let info;
  try {
    info = await stat(path);
  } catch {
    return;
  }

  if (info.isDirectory()) {
    const entries = await readdir(path);
    for (const entry of entries) {
      await collect(join(path, entry));
    }
    return;
  }

  if (/\.(mjs|js)$/.test(path)) {
    files.push(path);
  }
}

for (const root of roots) {
  await collect(root);
}

for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8"
  });

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
}

console.log(`Checked ${files.length} JavaScript files.`);
