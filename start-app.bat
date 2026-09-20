@echo off
chcp 65001 >nul
title VocabFlow - Flashcard App Launcher
echo ========================================================
echo        🌿 ยินดีต้อนรับสู่ VocabFlow Launcher 🌿
echo ========================================================
echo กำลังเปิดหน้าเว็บ http://localhost:3000 ในเบราว์เซอร์...
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo.
echo กำลังเริ่มรันเซิร์ฟเวอร์ Next.js...
echo (กด Ctrl + C เพื่อหยุดการทำงานเมื่อใช้งานเสร็จ)
echo.
npm.cmd run dev
pause
