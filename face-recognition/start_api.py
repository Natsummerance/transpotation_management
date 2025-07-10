#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
人脸识别API服务启动脚本
"""

import os
import sys
import subprocess
import time

def check_dependencies():
    """检查依赖包"""
    required_packages = [
        'flask',
        'flask-cors',
        'opencv-python',
        'numpy',
        'pillow',
        'mysql-connector-python'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'opencv-python':
                import cv2
            elif package == 'flask-cors':
                from flask_cors import CORS
            elif package == 'mysql-connector-python':
                import mysql.connector
            else:
                __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("缺少以下依赖包:")
        for package in missing_packages:
            print(f"  - {package}")
        print("\n请运行以下命令安装:")
        print(f"pip install {' '.join(missing_packages)}")
        return False
    
    return True

def check_opencv_data():
    """检查OpenCV数据文件"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    haar_file = os.path.join(current_dir, 'haarcascade_frontalface_default.xml')
    
    if not os.path.exists(haar_file):
        print("缺少OpenCV人脸检测数据文件: haarcascade_frontalface_default.xml")
        print("请从OpenCV安装目录复制该文件到当前目录")
        print("或者从以下链接下载:")
        print("https://github.com/opencv/opencv/blob/master/data/haarcascades/haarcascade_frontalface_default.xml")
        return False
    
    return True

def create_directories():
    """创建必要的目录"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    directories = [
        'data',
        'Facedata', 
        'traindata',
        'face_images'
    ]
    
    for directory in directories:
        dir_path = os.path.join(current_dir, directory)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
            print(f"创建目录: {directory}")

def main():
    print("="*50)
    print("人脸识别API服务启动脚本")
    print("="*50)
    
    # 检查依赖
    print("1. 检查Python依赖包...")
    if not check_dependencies():
        sys.exit(1)
    print("   ✓ 依赖包检查通过")
    
    # 检查OpenCV数据文件
    print("\n2. 检查OpenCV数据文件...")
    if not check_opencv_data():
        sys.exit(1)
    print("   ✓ OpenCV数据文件检查通过")
    
    # 创建目录
    print("\n3. 创建必要目录...")
    create_directories()
    print("   ✓ 目录创建完成")
    
    # 启动API服务
    print("\n4. 启动人脸识别API服务...")
    print("   服务地址: http://localhost:5000")
    print("   按 Ctrl+C 停止服务")
    print("-"*50)
    
    try:
        # 切换到脚本目录
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        # 启动Flask应用
        subprocess.run([sys.executable, 'face_api.py'], check=True)
        
    except KeyboardInterrupt:
        print("\n\n服务已停止")
    except subprocess.CalledProcessError as e:
        print(f"\n启动失败: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n未知错误: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()