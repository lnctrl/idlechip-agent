import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { brand, npxCommand, repoUrl } from "./brand.mjs";

const root = join(import.meta.dirname, "..");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function updatePackageJson() {
  const path = join(root, "package.json");
  const pkg = readJson(path);
  pkg.name = brand.packageName;
  pkg.description = brand.shortDescription;
  pkg.repository = { type: "git", url: `git+${repoUrl()}.git` };
  pkg.homepage = `${repoUrl()}#readme`;
  pkg.bugs = { url: `${repoUrl()}/issues` };
  pkg.bin = { [brand.packageName]: "./dist/cli.js" };
  writeJson(path, pkg);
}

function updatePackageLock() {
  const path = join(root, "package-lock.json");
  if (!existsSync(path)) return;
  const lock = readJson(path);
  lock.name = brand.packageName;
  if (lock.packages?.[""]) {
    lock.packages[""].name = brand.packageName;
    lock.packages[""].bin = { [brand.packageName]: "dist/cli.js" };
  }
  writeJson(path, lock);
}

function updateSourceBrand() {
  writeFileSync(
    join(root, "src", "brand.ts"),
    `export const BRAND_DISPLAY_NAME = ${JSON.stringify(brand.displayName)};\n` +
      `export const BRAND_PACKAGE_NAME = ${JSON.stringify(brand.packageName)};\n` +
      `export const BRAND_EXE_NAME = ${JSON.stringify(brand.exeName)};\n` +
      `export const BRAND_CREDENTIAL_FILE = ${JSON.stringify(brand.credentialFile)};\n`
  );
}

function updateReadme() {
  writeFileSync(
    join(root, "README.md"),
    `# ${brand.displayName}\n\n` +
      `Public GPU verifier for [IdleChip](https://idlechip.com). Scans GPUs on your PC and syncs to **idlechip.com** (and preview hosts). Requires a **pairing code** from the website (proves you are signed in).\n\n` +
      `## Setup\n\n` +
      `1. Sign in at **https://idlechip.com**\n` +
      `2. Open **My GPUs** -> **Generate pairing code**\n` +
      `3. On your PC:\n\n` +
      `\`\`\`powershell\n` +
      `${npxCommand("pair --url https://idlechip.com --code XXXX-YYYY")}\n` +
      `${npxCommand("scan")}\n` +
      `\`\`\`\n\n` +
      `Credentials save to \`%USERPROFILE%\\.idlechip\\${brand.credentialFile}\`.\n\n` +
      `## Commands\n\n` +
      `| Command | Purpose |\n` +
      `|---------|---------|\n` +
      `| \`pair --url URL --code CODE\` | One-time link to your signed-in account |\n` +
      `| \`scan\` | Detect GPUs and sync (requires pair) |\n` +
      `| \`register [--gpu KEY]\` | Register GPU on marketplace |\n` +
      `| \`watch\` | Re-scan + heartbeat every 60s |\n\n` +
      `## Security\n\n` +
      `- CLI only calls **idlechip.com**, **idlechip.vercel.app**, and localhost (dev)\n` +
      `- Sync/register/heartbeat require a **Bearer token** from pairing\n` +
      `- Pairing codes expire in **10 minutes** and are single-use\n` +
      `- Token binds to your PC's \`hostId\` on first sync\n\n` +
      `## Windows .exe\n\n` +
      `See [GitHub Releases](${repoUrl()}/releases).\n\n` +
      `\`\`\`powershell\n` +
      `.\\${brand.exeName} pair --url https://idlechip.com --code XXXX-YYYY\n` +
      `.\\${brand.exeName} scan\n` +
      `\`\`\`\n\n` +
      `## Rename\n\n` +
      `To change the public package/repo/exe identity, edit \`brand.json\`, then run \`npm run brand:apply\`.\n\n` +
      `## License\n\n` +
      `MIT\n`
  );
}

function updateRecreateScript() {
  writeFileSync(
    join(root, "scripts", "recreate-github-repo.ps1"),
    `# Recreate ${brand.repoOwner}/${brand.repoName} and remove ${brand.repoName}-archived.\n` +
      `# Requires: gh CLI logged in as repo admin; delete_repo scope to remove archive.\n` +
      `param(\n` +
      `  [switch]$DeleteArchiveOnly\n` +
      `)\n\n` +
      `$ErrorActionPreference = "Stop"\n` +
      `$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)\n` +
      `Set-Location $root\n` +
      `$exe = Join-Path $root ".release-backup\\${brand.exeName}"\n\n` +
      `if ($DeleteArchiveOnly) {\n` +
      `  gh repo delete ${brand.repoOwner}/${brand.repoName}-archived --yes\n` +
      `  exit 0\n` +
      `}\n\n` +
      `if (-not (Test-Path $exe)) {\n` +
      `  New-Item -ItemType Directory -Force -Path (Split-Path $exe) | Out-Null\n` +
      `  gh release download v1.0.0 -R ${brand.repoOwner}/${brand.repoName} -D (Split-Path $exe) -p "${brand.exeName}" 2>$null\n` +
      `}\n\n` +
      `gh repo view ${brand.repoOwner}/${brand.repoName} 2>$null\n` +
      `if ($LASTEXITCODE -ne 0) {\n` +
      `  gh repo create ${brand.repoOwner}/${brand.repoName} --public --description "${brand.description}"\n` +
      `}\n\n` +
      `git remote set-url origin git@github.com:${brand.repoOwner}/${brand.repoName}.git\n` +
      `git push -u origin main --force\n` +
      `git push origin --tags --force\n\n` +
      `gh release view v1.0.0 -R ${brand.repoOwner}/${brand.repoName} 2>$null\n` +
      `if ($LASTEXITCODE -ne 0) {\n` +
      `  npm run build:exe\n` +
      `  $exe = Join-Path $root "dist\\${brand.exeName}"\n` +
      `  gh release create v1.0.0 -R ${brand.repoOwner}/${brand.repoName} --title "v1.0.0" --latest --notes "npm: npx ${brand.packageName}@1.0.0" $exe\n` +
      `}\n\n` +
      `Write-Host "Delete archive (needs delete_repo scope):"\n` +
      `Write-Host "  gh auth refresh -h github.com -s delete_repo"\n` +
      `Write-Host "  gh repo delete ${brand.repoOwner}/${brand.repoName}-archived --yes"\n` +
      `Write-Host "Or: https://github.com/${brand.repoOwner}/${brand.repoName}-archived/settings -> Delete repository"\n`
  );
}

updatePackageJson();
updatePackageLock();
updateSourceBrand();
updateReadme();
updateRecreateScript();

console.log(`Applied brand: ${brand.packageName}`);
