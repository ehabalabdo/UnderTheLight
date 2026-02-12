Set-Location C:\Users\Ehab\under-the-light-app
Remove-Item -Force .env.production, check-env.ps1, deploy-final.ps1, deploy.ps1, fix-cron.ps1, fix-cron2.ps1, set-env.ps1 -ErrorAction SilentlyContinue
git add -A
git commit -m "Cleanup temp scripts"
git push origin main
