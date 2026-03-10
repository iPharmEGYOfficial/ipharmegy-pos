$source = "D:\ipharmegy_repos\ipharmegy-pos\exports\smart-pharmacy-summary.json"
$targetDir = "D:\ipharmegy_repos\ipharmegy-portal\src\data"

if(!(Test-Path $targetDir)){
  New-Item -ItemType Directory -Force $targetDir | Out-Null
}

$target = Join-Path $targetDir "smart-pharmacy-summary.json"
Copy-Item $source $target -Force

Write-Host "Portal data synced successfully."
