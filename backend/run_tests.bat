@echo off
echo ================================================================================
echo WORKOUT LOGGING TEST RESULTS
echo ================================================================================
echo.
cd "D:\Projects\Workout Tracking App\backend"
call venv\Scripts\activate.bat
python test_workout_logging.py
echo.
echo ================================================================================
echo TEST EXECUTION COMPLETE
echo ================================================================================
pause
