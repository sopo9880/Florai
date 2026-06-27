@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion

REM Use the folder that contains this bat file as the Florai project root.
set "PROJECT_DIR=%~dp0"
set "FRONTEND_PORT=3000"
set "NPM_CMD="

if not exist "%PROJECT_DIR%package.json" (
  echo package.json not found:
  echo %PROJECT_DIR%package.json
  pause
  exit /b 1
)

REM Prefer real Node.js installation paths. Do not use project-local npm shims.
if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
if not defined NPM_CMD if exist "%ProgramFiles(x86)%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles(x86)%\nodejs\npm.cmd"
if not defined NPM_CMD if exist "%APPDATA%\npm\npm.cmd" set "NPM_CMD=%APPDATA%\npm\npm.cmd"

if not defined NPM_CMD (
  for /f "delims=" %%i in ('where npm.cmd 2^>nul') do (
    set "CANDIDATE=%%i"
    echo !CANDIDATE! | findstr /I /C:"\node_modules\.bin\npm.cmd" >nul
    if errorlevel 1 if not defined NPM_CMD set "NPM_CMD=!CANDIDATE!"
  )
)

if not defined NPM_CMD (
  echo npm.cmd was not found.
  echo Florai needs Node.js 22.13.0 or newer.
  echo.
  where winget.exe >nul 2>&1
  if errorlevel 1 (
    echo Please install Node.js from:
    echo https://nodejs.org/
    pause
    exit /b 1
  )

  choice /C YN /M "Install Node.js LTS now with winget?"
  if errorlevel 2 (
    echo Please install Node.js from:
    echo https://nodejs.org/
    pause
    exit /b 1
  )

  winget install --id OpenJS.NodeJS.LTS -e --source winget
  if errorlevel 1 (
    echo Node.js installation failed.
    pause
    exit /b 1
  )

  if exist "%ProgramFiles%\nodejs\npm.cmd" set "NPM_CMD=%ProgramFiles%\nodejs\npm.cmd"
)

if not defined NPM_CMD (
  echo npm.cmd is still not available.
  echo Close this window and run Run.bat again after Node.js installation finishes.
  pause
  exit /b 1
)

echo Using npm:
echo %NPM_CMD%
echo.

REM Stop an existing local dev server on the Florai port.
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":%FRONTEND_PORT% " ^| findstr "LISTENING"') do taskkill /PID %%a /F >nul 2>&1

if not exist "%PROJECT_DIR%node_modules\vinext" (
  echo Installing dependencies...
  pushd "%PROJECT_DIR%"
  call "%NPM_CMD%" install
  if errorlevel 1 (
    popd
    echo npm install failed.
    pause
    exit /b 1
  )
  popd
)

start "Florai Frontend" /D "%PROJECT_DIR%" cmd /k ""%NPM_CMD%" run dev"

echo.
echo Project : %PROJECT_DIR%
echo Frontend: http://localhost:%FRONTEND_PORT%
echo.

endlocal
