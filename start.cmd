@echo off
REM Serve Vitals Local on http://localhost:8080 and open it.
REM
REM A server is required, not optional: the app is built from ES modules and
REM browsers refuse to load those over file://. Opening index.html by double
REM clicking gives a blank page.
REM
REM Nothing here reaches the internet. This serves files from this folder to
REM this machine only.

cd /d "%~dp0"

echo Serving Vitals Local at http://localhost:8080/
echo Press Ctrl+C to stop.
echo.

start "" http://localhost:8080/
python -m http.server 8080
