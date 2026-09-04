@echo off
chcp 65001 > nul
echo ==========================================
echo  NGS 결산 - 데이터 병합 및 자동 배포
echo ==========================================
echo.
echo [1/4] 최신 월별 CSV 데이터 자동 감지 및 스마트 병합 중...
node update_data.js
if %errorlevel% neq 0 (
    echo.
    echo [오류] 데이터 병합 중 문제가 발생하여 배포가 중단되었습니다.
    echo 오류 메시지를 확인해 주세요.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] 변경된 데이터 및 소스코드 감지 중...
git add app.js index.html index.css *.csv *.xlsx update_data.js deploy.bat

echo.
echo [3/4] 변경 사항 기록 중...
git commit -m "매월 데이터 자동 업데이트 및 배포 - %date% %time%"

echo.
echo [4/4] 깃허브로 전송 중 (Vercel 모바일 자동 배포)...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo [오류] 깃허브 전송에 실패했습니다. 인터넷 연결을 확인하세요.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo  🎉 배포 완료! Vercel 모바일 반영에 약 30초~1분 소요됩니다.
echo  스마트폰에서 새로고침하여 8월 데이터를 확인해보세요.
echo ==========================================
echo.
pause
