@echo off
cd /d "%~dp0"
if not exist .env (
  echo Create .env from .env.example first. See README-SI.md.
  pause
  exit /b 1
)
call npm.cmd start
pause
