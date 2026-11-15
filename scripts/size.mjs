#!/usr/bin/env node
// Usage: node scripts/size.mjs [file...]
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LIMIT = 5000;
const ROOTS = ["src", "tests"];

const files = process.argv.slice(2);

const isChecked = (file) =>
  file.endsWith(".ts") &&
  ROOTS.some((root) => file.replaceAll("\\", "/").startsWith(`${root}/`));

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });

const candidates = files.length > 0 ? files : ROOTS.flatMap(walk);

const offenders = candidates
  .filter(isChecked)
  .map((file) => ({ file, length: readFileSync(file, "utf8").length }))
  .filter(({ length }) => length > LIMIT);

for (const { file, length } of offenders) {
  console.error(`${file}: ${length} characters (limit ${LIMIT})`);
}

if (offenders.length > 0) {
  process.exit(1);
}
