@echo off
cd /d "%~dp0"
if exist venv\Scripts\python.exe (
  venv\Scripts\python.exe bootstrap.py %*
) else (
  where py >NUL 2>&1 && (py -3 bootstrap.py %*) || (python bootstrap.py %*)
)
if %errorlevel% neq 0 (
  echo.
  echo Failed. See bootstrap_log.txt. If Python is missing: install 3.11/3.12 from python.org with "Add python.exe to PATH".
)
echo.
echo Done.
pause
