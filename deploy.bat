@echo off
chcp 65001 > nul
echo ==========================================
echo  NGS 결산 - 데이터 병합 및 자동 배포
echo ==========================================
echo.
echo [1/4] 최신 월별 CSV 데이터 자동 병합 중...
node update_data.js

echo.
echo [2/4] 변경된 데이터 및 소스코드 감지 중...
git add app.js index.html index.css *.csv *.xlsx update_data.js

echo.
echo [3/4] 변경 사항 기록 중...
git commit -m "매월 데이터 자동 업데이트 및 배포 - %date% %time%"

echo.
echo [4/4] 깃허브로 전송 중 (GitHub Pages 동기화)...
git push origin main

echo.
echo ==========================================
echo  배포 완료! 깃허브 페이지 반영에 약 30초~1분 정도 소요됩니다.
echo ==========================================
echo.
pause
