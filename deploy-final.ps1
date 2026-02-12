Set-Location C:\Users\Ehab\under-the-light-app
vercel env rm CRON_SECRET production --yes
git add -A
git commit -m "Remove vercel cron config (Hobby plan limitation)"
git push origin main
vercel --prod --yes
