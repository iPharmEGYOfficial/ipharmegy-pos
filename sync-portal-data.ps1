@'
$source = "D:\ipharmegy_repos\ipharmegy-pos\exports\smart-pharmacy-summary.json"
$target = "D:\ipharmegy_repos\ipharmegy-portal\src\data\smart-pharmacy-summary.json"

Copy-Item $source $target -Force

Write-Host "Portal data synced successfully."
'@ | Set-Content .\sync-portal-data.ps1