$ErrorActionPreference = "Continue"

Write-Host "Cleaning up C: drive temporary files..." -ForegroundColor Cyan
Remove-Item $env:TEMP\* -Recurse -Force -ErrorAction SilentlyContinue
Clear-RecycleBin -Force -ErrorAction SilentlyContinue

Write-Host "Creating Temporary Swap Folders on E: Drive..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "E:\TEMP" | Out-Null
New-Item -ItemType Directory -Force -Path "E:\gradle_cache" | Out-Null

Write-Host "Forcing Windows to Use E: Drive for Temp Extraction..." -ForegroundColor Yellow
$env:TEMP = "E:\TEMP"
$env:TMP = "E:\TEMP"
$env:GRADLE_USER_HOME = "E:\gradle_cache"

Write-Host "Starting Android Flutter Build with E: mapping..." -ForegroundColor Green
flutter build apk --release --dart-define=API_HOST=logiflow-smart-logistics-delivery.onrender.com --dart-define=API_PORT=443

Write-Host "Build finished!" -ForegroundColor Cyan
