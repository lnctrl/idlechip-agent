import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brandPath = join(root, "brand.json");

export const brand = JSON.parse(readFileSync(brandPath, "utf-8"));

export function repoUrl() {
  return `https://github.com/${brand.repoOwner}/${brand.repoName}`;
}

export function npxCommand(args = "") {
  return `npx ${brand.packageName}${args ? ` ${args}` : ""}`;
}
