@echo off
cd /d "%~dp0"
rem Code-Video project: environment and tools live at the ROOT (..\..\env, ..\..\tools); this folder holds only data and output
set "ROOT=%~dp0..\.."
set "CV_ENV=%ROOT%\env"
set "PY=%CV_ENV%\venv\Scripts\python.exe"
if not exist "%PY%" (
  rem shared environment not installed yet -- fall back to the old location (Documents\tungi-sam2)
  set "CV_ENV=%USERPROFILE%\Documents\tungi-sam2"
  set "PY=%USERPROFILE%\Documents\tungi-sam2\venv\Scripts\python.exe"
)
if not exist "%PY%" (
  echo Environment not found. Run Code-Video\setup.bat first.
  pause
  exit /b 1
)
echo env: %CV_ENV%
"%PY%" -u "%ROOT%\tools\sam2_video.py" --project "%~dp0." %*
if %errorlevel% neq 0 (
  echo.
  echo Failed. See output\log.txt.
)
echo.
echo Done.
pause
