# Client Hunter: one-shot installer for Windows (Claude Code skills + Claude app bundle).
# Usage (PowerShell):  powershell -ExecutionPolicy Bypass -File install-windows.ps1 [-Repo <git url>]
param([string]$Repo = "")

$ErrorActionPreference = "Stop"
$skills = Join-Path $env:USERPROFILE ".claude\skills"
$dest = Join-Path $skills "client-hunter"

function Need($cmd, $hint) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { Write-Host "Missing: $cmd. $hint" -ForegroundColor Yellow; exit 1 }
}
Need git "Install Git for Windows from https://git-scm.com/download/win and run this again."
$py = $null
foreach ($c in @("py", "python", "python3")) { if (Get-Command $c -ErrorAction SilentlyContinue) { $py = $c; break } }
if (-not $py) { Write-Host "Missing: Python 3. Install it from https://www.python.org/downloads/ and run this again." -ForegroundColor Yellow; exit 1 }

New-Item -ItemType Directory -Force -Path $skills | Out-Null
if (Test-Path (Join-Path $dest ".git")) {
  Write-Host "Updating $dest"; git -C $dest pull --ff-only
} elseif ($Repo) {
  Write-Host "Cloning $Repo"; git clone --depth 1 $Repo $dest
} elseif (Test-Path (Join-Path $PSScriptRoot "SKILL.md")) {
  if ((Resolve-Path $PSScriptRoot).Path -ne $dest) { Write-Host "Copying from $PSScriptRoot"; Copy-Item -Recurse -Force $PSScriptRoot $dest }
} else { Write-Host "Pass -Repo <git url> or run this script from inside the repo." -ForegroundColor Yellow; exit 1 }

$args1 = @("$dest\setup.py"); if ($py -eq "py") { $args1 = @("-3") + $args1 }
& $py @args1
& $py @($args1 + @("--claude-md", (Join-Path $env:USERPROFILE ".claude\CLAUDE.md")))
& $py @($args1 + @("--bundle"))

Write-Host ""
Write-Host "Claude Code: installed. Start a new session and say: Client Hunter" -ForegroundColor Green
Write-Host "Claude app and Cowork: upload $dest\dist\client-hunter.skill in Settings > Capabilities > Skills (one time)." -ForegroundColor Green
