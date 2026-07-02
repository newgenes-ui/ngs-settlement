@echo off
chcp 65001 > nul
echo ==========================================
echo  NGS 결산 - 깃허브 자동 배포 스크립트
echo ==========================================
echo.
echo [1/3] 변경된 데이터 및 소스코드 감지 중...
git add app.js index.html index.css 매입.csv *매입.csv *매출.csv *매출.xls *매입.xls

echo.
echo [2/3] 변경 사항 기록 중...
git commit -m "매월 말일 데이터 업데이트 - %date% %time%"

echo.
echo [3/3] 깃허브로 전송 중 (GitHub Pages 동기화)...
git push origin main

echo.
echo ==========================================
echo  배포 완료! 깃허브 페이지 반영에 약 30초~1분 정도 소요됩니다.
echo ==========================================
echo.
pause
