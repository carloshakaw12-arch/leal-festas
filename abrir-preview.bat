@echo off
cd /d "%~dp0"
start "" http://localhost:5500
py -m http.server 5500
if errorlevel 1 python -m http.server 5500
pause
