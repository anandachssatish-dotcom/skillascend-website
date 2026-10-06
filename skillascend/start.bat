@echo off
cd /d "%~dp0"
if not exist ".env" if exist "_env" copy "_env" ".env" >nul
echo Starting SkillAscend...
start "" http://localhost:3000
node server.js
pause
