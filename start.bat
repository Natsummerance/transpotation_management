@echo off
chcp 65001 >nul
title 交通管理系统启动器

echo.
echo ============================================================
echo                   交通管理系统启动器
echo ============================================================
echo 版本: 1.0.0
echo 作者: AI Assistant
echo.

:: 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Python未安装或未添加到PATH
    pause
    exit /b 1
)

:: 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Node.js未安装或未添加到PATH
    pause
    exit /b 1
)

:: 检查npm是否安装
npm --version >nul 2>&1
if errorlevel 1 (
    echo [错误] npm未安装或未添加到PATH
    pause
    exit /b 1
)

echo [信息] 系统依赖检查完成

:: 检查虚拟环境
if not exist ".venv" (
    echo [信息] 创建虚拟环境...
    python -m venv .venv
    if errorlevel 1 (
        echo [错误] 虚拟环境创建失败
        pause
        exit /b 1
    )
    echo [信息] 虚拟环境创建完成
)

:: 询问是否安装依赖
set /p choice="是否安装/更新项目依赖? (y/n): "
if /i "%choice%"=="y" (
    echo.
    echo ============================================================
    echo                    安装项目依赖
    echo ============================================================
    
    echo [信息] 安装Django依赖...
    cd django_taxi_analysis
    ..\.venv\Scripts\pip.exe install -r requirements.txt
    if errorlevel 1 (
        echo [错误] Django依赖安装失败
        pause
        exit /b 1
    )
    cd ..
    
    echo [信息] 安装人脸识别依赖...
    .venv\Scripts\pip.exe install flask flask-cors opencv-python opencv-contrib-python pillow mysql-connector-python
    if errorlevel 1 (
        echo [错误] 人脸识别依赖安装失败
        pause
        exit /b 1
    )
    
    echo [信息] 安装前端依赖...
    npm install
    if errorlevel 1 (
        echo [错误] 前端依赖安装失败
        pause
        exit /b 1
    )
    
    echo [信息] 依赖安装完成
)

echo.
echo ============================================================
echo                    启动所有服务
echo ============================================================

:: 启动Django服务
echo [信息] 启动Django后端服务...
start "Django Backend" cmd /k "cd /d %cd%\django_taxi_analysis && ..\.venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000"

:: 等待Django启动
timeout /t 3 /nobreak >nul

:: 启动人脸识别服务
echo [信息] 启动CV2人脸识别服务...
start "Face Recognition" cmd /k "cd /d %cd%\face-recognition-cv2-master\face-recognition-cv2-master && ..\..\.venv\Scripts\python.exe face_api.py"

:: 等待人脸识别服务启动
timeout /t 3 /nobreak >nul

:: 启动前端服务
echo [信息] 启动前端Next.js服务...
start "Frontend" cmd /k "cd /d %cd% && npm run dev"

:: 等待前端启动
timeout /t 5 /nobreak >nul

echo.
echo ============================================================
echo                      服务状态
echo ============================================================
echo [Django] 启动中... (端口: 8000)
echo [人脸识别] 启动中... (端口: 5000)
echo [前端] 启动中... (端口: 3000)

echo.
echo ============================================================
echo                      访问地址
echo ============================================================
echo 前端应用:
echo   http://localhost:3000
echo.
echo Django后端:
echo   http://localhost:8000
echo   http://localhost:8000/admin
echo.
echo 人脸识别API:
echo   http://localhost:5000
echo   http://localhost:5000/status

echo.
echo [信息] 所有服务已启动! 关闭此窗口将停止所有服务
echo [提示] 按任意键关闭所有服务...
pause >nul

:: 关闭所有相关进程
echo [信息] 正在关闭所有服务...
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im cmd.exe >nul 2>&1

echo [信息] 所有服务已关闭
pause 