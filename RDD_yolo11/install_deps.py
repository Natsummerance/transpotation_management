#!/usr/bin/env python3
"""
YOLO依赖安装脚本
处理网络代理和依赖安装问题
"""

import subprocess
import sys
import os
import platform

def run_command(cmd, description):
    """运行命令并处理错误"""
    print(f"\n=== {description} ===")
    print(f"执行命令: {cmd}")
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} 成功")
            if result.stdout:
                print("输出:", result.stdout)
            return True
        else:
            print(f"❌ {description} 失败")
            print("错误:", result.stderr)
            return False
    except Exception as e:
        print(f"❌ {description} 异常: {e}")
        return False

def install_with_mirror(package, mirror_url):
    """使用镜像源安装包"""
    cmd = f"pip install -i {mirror_url} {package}"
    return run_command(cmd, f"从 {mirror_url} 安装 {package}")

def main():
    print("=== YOLO依赖安装脚本 ===")
    print(f"Python版本: {sys.version}")
    print(f"操作系统: {platform.system()} {platform.release()}")
    
    # 检查是否在虚拟环境中
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)
    print(f"虚拟环境: {'是' if in_venv else '否'}")
    
    # 升级pip
    print("\n1. 升级pip...")
    run_command("python -m pip install --upgrade pip", "升级pip")
    
    # 尝试不同的镜像源
    mirrors = [
        "https://pypi.tuna.tsinghua.edu.cn/simple/",
        "https://mirrors.aliyun.com/pypi/simple/",
        "https://pypi.douban.com/simple/",
        "https://pypi.mirrors.ustc.edu.cn/simple/"
    ]
    
    packages = [
        "ultralytics",
        "torch",
        "torchvision",
        "opencv-python",
        "pillow",
        "numpy"
    ]
    
    print("\n2. 安装依赖包...")
    
    for package in packages:
        print(f"\n--- 安装 {package} ---")
        success = False
        
        # 首先尝试默认源
        if run_command(f"pip install {package}", f"安装 {package}"):
            success = True
        else:
            # 尝试镜像源
            for mirror in mirrors:
                if install_with_mirror(package, mirror):
                    success = True
                    break
        
        if not success:
            print(f"⚠️  {package} 安装失败，但继续安装其他包")
    
    print("\n3. 验证安装...")
    
    # 测试导入
    test_imports = [
        "ultralytics",
        "torch", 
        "cv2",
        "PIL",
        "numpy"
    ]
    
    for module in test_imports:
        try:
            __import__(module)
            print(f"✅ {module} 导入成功")
        except ImportError as e:
            print(f"❌ {module} 导入失败: {e}")
    
    print("\n=== 安装完成 ===")
    print("如果某些包安装失败，可以手动安装或使用模拟模式")

if __name__ == "__main__":
    main() 