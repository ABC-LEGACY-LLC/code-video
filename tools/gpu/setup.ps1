# Code-Video one-time setup (PowerShell). Run: setup.bat  (or:  powershell -ExecutionPolicy Bypass -File setup.ps1)
#   1. moves the existing environment (venv, sam2_repo, ckpt) from Documents\tungi-sam2 into Code-Video\env  (no re-download)
#   2. removes the first-draft files created on 2026-09-27 (Uzbek-named folders, *_p3d files) -- listed explicitly below, nothing else
#   3. renames Projects\personaj3d-sam2\kadrlar -> frames
#   4. runs env\bootstrap.py (repairs sam2's editable install path, adds CoTracker3)
#   5. runs the first project: Projects\personaj3d-sam2
# Every step is logged to setup_log.txt and is safe to repeat.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Old  = Join-Path $env:USERPROFILE 'Documents\tungi-sam2'
$EnvDir = Join-Path $Root 'env'
$Proj = Join-Path $Root 'Projects\personaj3d-sam2'
$Log  = Join-Path $Root 'setup_log.txt'
function Say($m) { $s = "[$(Get-Date -Format HH:mm:ss)] $m"; Write-Host $s; Add-Content -Path $Log -Value $s }

Say "=== Code-Video setup in $Root"
New-Item -ItemType Directory -Force -Path $EnvDir | Out-Null

# 1. move the environment from the old project folder
foreach ($d in 'venv', 'sam2_repo', 'ckpt') {
  $src = Join-Path $Old $d; $dst = Join-Path $EnvDir $d
  if ((Test-Path $src) -and -not (Test-Path $dst)) { Say "move  $src  ->  $dst"; Move-Item -Path $src -Destination $dst }
  elseif (Test-Path $dst) { Say "already in place: $dst" }
  else { Say "not found: $src  (bootstrap will download it)" }
}

# 2. remove first-draft leftovers (only these paths)
$leftovers = @(
  (Join-Path $Root 'muhit'), (Join-Path $Root 'asbob'),
  (Join-Path $Old 'personaj3d'), (Join-Path $Old 'MUHIT_KOCHDI.txt'),
  (Join-Path $Proj 'sam2_p3d.py'), (Join-Path $Proj 'run_p3d.bat'), (Join-Path $Proj 'prompts_p3d.json'),
  (Join-Path $Proj 'prompts_p3d.npz'), (Join-Path $Proj 'belgilar_p3d.json'), (Join-Path $Proj 'belgilar.json')
)
foreach ($p in $leftovers) { if (Test-Path $p) { Say "remove $p"; Remove-Item -Path $p -Recurse -Force } }

# 3. rename kadrlar -> frames
$k = Join-Path $Proj 'kadrlar'; $f = Join-Path $Proj 'frames'
if ((Test-Path $k) -and -not (Test-Path $f)) { Say "rename $k -> frames"; Rename-Item -Path $k -NewName 'frames' }

# 4. environment (repair sam2 path after the move, add CoTracker3; downloads only what is missing)
$py = Join-Path $EnvDir 'venv\Scripts\python.exe'
Say "--- bootstrap"
if (Test-Path $py) { & $py (Join-Path $EnvDir 'bootstrap.py') } else { & py -3 (Join-Path $EnvDir 'bootstrap.py') }
if ($LASTEXITCODE -ne 0) { Say "bootstrap failed (exit $LASTEXITCODE) -- see env\bootstrap_log.txt"; exit 1 }

# 5. first project run
Say "--- project personaj3d-sam2"
$env:CV_ENV = $EnvDir
& $py (Join-Path $Root 'tools\sam2_video.py') --project $Proj
Say "=== done (exit $LASTEXITCODE) -- results in Projects\personaj3d-sam2\output"
