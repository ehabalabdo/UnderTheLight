Set-Location C:\Users\Ehab\under-the-light-app
Get-Content .env.production | vercel env add NEXTAUTH_URL production --force
