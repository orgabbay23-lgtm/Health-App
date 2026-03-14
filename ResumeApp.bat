@echo off
cd C:\Users\ronng\OneDrive\מסמכים\GitHub\Health-App
start cmd /k "npm run dev"
timeout /t 3
start http://localhost:5173