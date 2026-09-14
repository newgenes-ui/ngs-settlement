@echo off
chcp 65001 > nul
title NGS 결산 원클릭 자동 배포
if exist "%~dp0deploy.bat" (
    cd /d "%~dp0"
) else if exist "%~dp0NGS결산\deploy.bat" (
    cd /d "%~dp0NGS결산"
) else (
    cd /d "C:\Users\admin\Desktop\NGS결산"
)
call deploy.bat

