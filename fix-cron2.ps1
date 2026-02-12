Set-Location C:\Users\Ehab\under-the-light-app
vercel env rm CRON_SECRET production --yes
[System.IO.File]::WriteAllText("$PWD\.env.tmp", "cron-secret-underthelight-2024")
Get-Content -Raw .env.tmp | ForEach-Object { $_.TrimEnd() } | vercel env add CRON_SECRET production --force
Remove-Item .env.tmp
