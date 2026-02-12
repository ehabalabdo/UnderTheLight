Set-Location C:\Users\Ehab\under-the-light-app
vercel env rm CRON_SECRET production --yes
"cron-secret-underthelight-2024" | vercel env add CRON_SECRET production --force
