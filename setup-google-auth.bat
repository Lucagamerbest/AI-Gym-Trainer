@echo off
echo ========================================
echo Google Sign-In iOS Setup Script
echo ========================================
echo.
echo This script will help you create a development build
echo so Google Sign-In works on your iPhone.
echo.
echo You'll need:
echo   1. An Expo account (create at expo.dev if needed)
echo   2. About 15 minutes of build time
echo   3. Your iPhone nearby to install the app
echo.
pause

echo.
echo Step 1: Logging in to Expo...
echo.
call eas login

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Login failed. Please create an account at https://expo.dev/signup
    echo Then run this script again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 2: Starting iOS Development Build
echo ========================================
echo.
echo This will take 10-15 minutes.
echo You can minimize this window and do other things.
echo.
pause

call eas build --profile development --platform ios

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed. Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! Build Complete
echo ========================================
echo.
echo Next steps:
echo   1. Look for the QR code or download link above
echo   2. Scan the QR code with your iPhone camera
echo   3. Download and install the app
echo   4. Open the new app (NOT Expo Go)
echo   5. Try Google Sign-In - it will work!
echo.
pause
