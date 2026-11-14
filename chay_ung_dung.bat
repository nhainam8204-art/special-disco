@echo off
chcp 65001 >nul
title Trường THPT Số 2 Nguyễn Trường Tộ - Hệ Thống Học Tiếng Anh & Cấp Chứng Chỉ
cd /d "%~dp0"
echo ======================================================================
echo  Đang khởi động Hệ thống Học Tiếng Anh - THPT Số 2 Nguyễn Trường Tộ...
echo ======================================================================

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    python server.py
    goto end
)

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
    py server.py
    goto end
)

if exist "C:\Program Files\Python311\python.exe" (
    "C:\Program Files\Python311\python.exe" server.py
    goto end
)

echo [LỖI] Không tìm thấy Python trên máy tính.
echo Vui lòng cài đặt Python (phiên bản 3.9 trở lên) và tích chọn "Add Python to PATH".
pause

:end

