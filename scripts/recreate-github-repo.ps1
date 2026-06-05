# Recreate lnctrl/idlechip-verifier and remove idlechip-verifier-archived.
# Requires: gh CLI logged in as repo admin; delete_repo scope to remove archive.
param(
  [switch]$DeleteArchiveOnly
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root
$exe = Join-Path $root ".release-backup\idlechip-verifier-win-x64.exe"

if ($DeleteArchiveOnly) {
  gh repo delete lnctrl/idlechip-verifier-archived --yes
  exit 0
}

if (-not (Test-Path $exe)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $exe) | Out-Null
  gh release download v1.0.0 -R lnctrl/idlechip-verifier -D (Split-Path $exe) -p "idlechip-verifier-win-x64.exe" 2>$null
}

gh repo view lnctrl/idlechip-verifier 2>$null
if ($LASTEXITCODE -ne 0) {
  gh repo create lnctrl/idlechip-verifier --public --description "IdleChip GPU verifier - pair, scan, and sync GPUs to idlechip.com"
}

git remote set-url origin git@github.com:lnctrl/idlechip-verifier.git
git push -u origin main --force
git push origin --tags --force

gh release view v1.0.0 -R lnctrl/idlechip-verifier 2>$null
if ($LASTEXITCODE -ne 0) {
  npm run build:exe
  $exe = Join-Path $root "dist\idlechip-verifier-win-x64.exe"
  gh release create v1.0.0 -R lnctrl/idlechip-verifier --title "v1.0.0" --latest --notes "npm: npx idlechip-verifier@1.0.0" $exe
}

Write-Host "Delete archive (needs delete_repo scope):"
Write-Host "  gh auth refresh -h github.com -s delete_repo"
Write-Host "  gh repo delete lnctrl/idlechip-verifier-archived --yes"
Write-Host "Or: https://github.com/lnctrl/idlechip-verifier-archived/settings -> Delete repository"
