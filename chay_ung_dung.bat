@echo off
chcp 65001 >nul
title Trường THPT Số 2 Nguyễn Trường Tộ - Hệ Thống Học Tiếng Anh & Cấp Chứng Chỉ
cd /d "%~dp0"
echo Đang khởi động Hệ thống Học Tiếng Anh - Trường THPT Số 2 Nguyễn Trường Tộ...
"C:\Program Files\Python311\python.exe" server.py
pause
