param(
  [string]$BaseUrl = 'http://localhost:3002'
)

Write-Host "Running purchase flow against $BaseUrl"

if (-not (Get-Command newman -ErrorAction SilentlyContinue)) {
  Write-Host "Newman is not installed. Attempting to install globally..."
  npm install -g newman
  if (-not (Get-Command newman -ErrorAction SilentlyContinue)) {
    Write-Error "Newman not available. Please install newman and re-run.`nRun: npm install -g newman"
    exit 2
  }
}

# ensure tmp folder
$tmp = Join-Path $PSScriptRoot '..\tmp'
if (-not (Test-Path $tmp)) { New-Item -ItemType Directory -Path $tmp | Out-Null }

Write-Host "Fetching first product id via DB helper..."
try {
  $nodeOut = node .\scripts\check_products.js 2>&1
  $j = $null
  try { $j = $nodeOut | ConvertFrom-Json } catch { Write-Host "Node helper output: $nodeOut"; throw }
  $firstId = $j.firstId
} catch {
  Write-Error "Failed to obtain product id: $_"
  exit 3
}

if (-not $firstId) { Write-Error "No products found via DB helper."; exit 4 }
Write-Host "Found product id: $firstId"

# run newman for the purchase flow sequence
$collection = Join-Path $PSScriptRoot '..\docs\postman_collection.json'
$envFile = Join-Path $PSScriptRoot '..\docs\postman_env.json'

$folders = @(
  'Auth - Register',
  'Auth - Login (captures token cookie)',
  'Cart - Add',
  'Cart - Get',
  'Addresses - Create',
  'Orders - Create COD',
  'Orders - List'
)

Write-Host "Preparing newman arguments..."
$args = @('run', $collection, '--environment', $envFile, '--env-var', "baseUrl=$BaseUrl", '--env-var', "productId=$firstId")
foreach ($f in $folders) { $args += '--folder'; $args += $f }
$args += '--reporters'; $args += 'cli,json'; $args += '--reporter-json-export'; $args += (Join-Path $tmp 'newman_result.json')

Write-Host "Executing newman with args: $($args -join ' ')"
$newmanExe = 'newman'
try {
  & $newmanExe @args
  $ec = $LASTEXITCODE
} catch {
  Write-Error "Newman invocation failed: $_"
  exit 5
}

if ($ec -ne 0) {
  Write-Error "Newman run failed with exit code $ec"
  exit $ec
}

Write-Host "Newman finished. Output file: $tmp\newman_result.json"

# write a small summary file with the run object
try {
  $json = Get-Content -Path (Join-Path $tmp 'newman_result.json') -Raw | ConvertFrom-Json
  $summary = $json.run | ConvertTo-Json -Depth 4
  $summary | Out-File -FilePath (Join-Path $tmp 'newman_summary.json') -Encoding utf8
  Write-Host "Summary written to $tmp\newman_summary.json"
} catch {
  Write-Warning "Couldn't create summary: $_"
}

Write-Host "Done. Inspect $tmp\newman_result.json for full details."
