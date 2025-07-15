 #!/usr/bin/env python3
"""
交通管理系统集成启动脚本
同时启动Django后端、CV2人脸识别服务和前端Next.js应用
"""

import os
import sys
import subprocess
import time
import platform
from pathlib import Path

# 颜色输出
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_colored(text, color):
    """打印彩色文本"""
    print(f"{color}{text}{Colors.ENDC}")

def print_header(text):
    """打印标题"""
    print_colored(f"\n{'='*60}", Colors.HEADER)
    print_colored(f"  {text}", Colors.HEADER)
    print_colored(f"{'='*60}", Colors.ENDC)

def print_status(service, status, color=Colors.OKGREEN):
    """打印服务状态"""
    print_colored(f"[{service}] {status}", color)

class ServiceManager:
    def __init__(self):
        self.base_dir = Path(__file__).parent.absolute()
        self.is_windows = platform.system() == "Windows"
        
    def check_dependencies(self):
        """检查依赖"""
        print_header("检查系统依赖")
        
        # 检查Python版本
        python_version = sys.version_info
        if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
            print_colored("错误: 需要Python 3.8或更高版本", Colors.FAIL)
            return False
        print_status("Python", f"版本 {python_version.major}.{python_version.minor}.{python_version.micro}")
        
        # 检查Node.js
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                print_status("Node.js", result.stdout.strip())
            else:
                print_colored("错误: Node.js未安装", Colors.FAIL)
                return False
        except FileNotFoundError:
            print_colored("错误: Node.js未安装", Colors.FAIL)
            return False
        
        # 检查npm
        npm_found = False
        npm_paths = ['npm', 'npm.cmd']
        
        for npm_cmd in npm_paths:
            try:
                result = subprocess.run([npm_cmd, '--version'], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    print_status("npm", result.stdout.strip())
                    npm_found = True
                    break
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue
        
        if not npm_found:
            print_colored("错误: npm未安装或无法访问", Colors.FAIL)
            return False
        
        return True
    
    def check_directories(self):
        """检查必要的目录和文件"""
        print_header("检查项目结构")
        
        required_dirs = [
            "django_taxi_analysis",
            "face-recognition-cv2-master",
            "app"
        ]
        
        for dir_path in required_dirs:
            full_path = self.base_dir / dir_path
            if full_path.exists():
                print_status("目录", f"✓ {dir_path}")
            else:
                print_colored(f"错误: 目录不存在 {dir_path}", Colors.FAIL)
                return False
        
        # 检查关键文件
        key_files = [
            "django_taxi_analysis/manage.py",
            "django_taxi_analysis/requirements.txt",
            "face-recognition-cv2-master/face_api.py",
            "package.json",
            "next.config.mjs"
        ]
        
        for file_path in key_files:
            full_path = self.base_dir / file_path
            if full_path.exists():
                print_status("文件", f"✓ {file_path}")
            else:
                print_colored(f"错误: 文件不存在 {file_path}", Colors.FAIL)
                return False
        
        return True
    
    def install_dependencies(self):
        """安装依赖"""
        print_header("安装项目依赖")
        
        # 检查虚拟环境
        venv_path = self.base_dir / ".venv"
        if not venv_path.exists():
            print_colored("创建虚拟环境...", Colors.OKBLUE)
            try:
                subprocess.run([
                    sys.executable, "-m", "venv", ".venv"
                ], cwd=self.base_dir, check=True)
                print_status("虚拟环境", "创建完成")
            except subprocess.CalledProcessError as e:
                print_colored(f"错误: 虚拟环境创建失败 - {e}", Colors.FAIL)
                return False
        
        # 设置虚拟环境路径
        if self.is_windows:
            python_path = venv_path / "Scripts" / "python.exe"
            pip_path = venv_path / "Scripts" / "pip.exe"
        else:
            python_path = venv_path / "bin" / "python"
            pip_path = venv_path / "bin" / "pip"
        
        # 安装Python依赖
        print_colored("安装Django依赖...", Colors.OKBLUE)
        django_dir = self.base_dir / "django_taxi_analysis"
        try:
            subprocess.run([
                str(pip_path), "install", "-r", "requirements.txt"
            ], cwd=django_dir, check=True)
            print_status("Django依赖", "安装完成")
        except subprocess.CalledProcessError as e:
            print_colored(f"错误: Django依赖安装失败 - {e}", Colors.FAIL)
            return False
        
        # 安装人脸识别依赖
        print_colored("安装人脸识别依赖...", Colors.OKBLUE)
        try:
            # 先升级numpy到兼容版本
            print_colored("升级numpy到兼容版本...", Colors.OKBLUE)
            subprocess.run([
                str(pip_path), "install", "--upgrade", "numpy>=2.0.0"
            ], check=True)
            
            # 然后安装其他依赖
            subprocess.run([
                str(pip_path), "install", "flask", "flask-cors", "opencv-python", 
                "opencv-contrib-python", "pillow", "mysql-connector-python"
            ], check=True)
            print_status("人脸识别依赖", "安装完成")
        except subprocess.CalledProcessError as e:
            print_colored(f"错误: 人脸识别依赖安装失败 - {e}", Colors.FAIL)
            return False
        
        # 安装Node.js依赖
        print_colored("安装前端依赖...", Colors.OKBLUE)
        npm_cmd = 'npm'
        # 尝试找到npm命令
        for cmd in ['npm', 'npm.cmd']:
            try:
                result = subprocess.run([cmd, '--version'], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    npm_cmd = cmd
                    break
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue
        
        try:
            subprocess.run([npm_cmd, 'install'], cwd=self.base_dir, check=True)
            print_status("前端依赖", "安装完成")
        except subprocess.CalledProcessError as e:
            print_colored(f"错误: 前端依赖安装失败 - {e}", Colors.FAIL)
            return False
        
        return True
    
    def start_services(self):
        """启动所有服务"""
        print_header("启动所有服务")
        
        # 检查虚拟环境
        venv_path = self.base_dir / ".venv"
        if not venv_path.exists():
            print_colored("错误: 虚拟环境不存在，请先创建虚拟环境", Colors.FAIL)
            return False
        
        # 设置虚拟环境路径
        if self.is_windows:
            python_path = venv_path / "Scripts" / "python.exe"
        else:
            python_path = venv_path / "bin" / "python"
        
        if not python_path.exists():
            print_colored(f"错误: 虚拟环境Python不存在: {python_path}", Colors.FAIL)
            return False
        
        # 找到npm命令
        npm_cmd = 'npm'
        for cmd in ['npm', 'npm.cmd']:
            try:
                result = subprocess.run([cmd, '--version'], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    npm_cmd = cmd
                    break
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue
        
        try:
            # 启动Django服务
            print_colored("启动Django后端服务...", Colors.OKBLUE)
            django_dir = self.base_dir / "django_taxi_analysis"
            if self.is_windows:
                subprocess.Popen([
                    "start", "cmd", "/k", 
                    f"cd /d {django_dir} && {python_path} manage.py runserver 0.0.0.0:8000"
                ], shell=True)
            else:
                subprocess.Popen([
                    str(python_path), "manage.py", "runserver", "0.0.0.0:8000"
                ], cwd=django_dir)
            
            print_status("Django", "启动中... (端口: 8000)")
            time.sleep(2)
            
            # 启动人脸识别服务
            print_colored("启动CV2人脸识别服务...", Colors.OKBLUE)
            face_dir = self.base_dir / "face-recognition-cv2-master"
            if self.is_windows:
                subprocess.Popen([
                    "start", "cmd", "/k", 
                    f"cd /d {face_dir} && {python_path} face_api.py"
                ], shell=True)
            else:
                subprocess.Popen([
                    str(python_path), "face_api.py"
                ], cwd=face_dir)
            
            print_status("人脸识别", "启动中... (端口: 5000)")
            time.sleep(2)
            
            # 启动前端服务
            print_colored("启动前端Next.js服务...", Colors.OKBLUE)
            if self.is_windows:
                subprocess.Popen([
                    "start", "cmd", "/k", 
                    f"cd /d {self.base_dir} && {npm_cmd} run dev"
                ], shell=True)
            else:
                subprocess.Popen([npm_cmd, 'run', 'dev'], cwd=self.base_dir)
            
            print_status("前端", "启动中... (端口: 3000)")
            time.sleep(3)
            
            return True
            
        except Exception as e:
            print_colored(f"错误: 服务启动失败 - {e}", Colors.FAIL)
            return False
    
    def show_urls(self):
        """显示访问地址"""
        print_header("访问地址")
        print_colored("前端应用:", Colors.OKGREEN)
        print_colored("  http://localhost:3000", Colors.OKBLUE)
        print_colored("\nDjango后端:", Colors.OKGREEN)
        print_colored("  http://localhost:8000", Colors.OKBLUE)
        print_colored("  http://localhost:8000/admin", Colors.OKBLUE)
        print_colored("\n人脸识别API:", Colors.OKGREEN)
        print_colored("  http://localhost:5000", Colors.OKBLUE)
        print_colored("  http://localhost:5000/status", Colors.OKBLUE)
    
    def run(self):
        """运行主程序"""
        print_header("交通管理系统启动器")
        print_colored("版本: 1.0.0", Colors.OKCYAN)
        print_colored("作者: AI Assistant", Colors.OKCYAN)
        
        # 检查依赖
        if not self.check_dependencies():
            return False
        
        # 检查目录结构
        if not self.check_directories():
            return False
        
        # 询问是否安装依赖
        print_colored("\n是否安装/更新项目依赖? (y/n): ", Colors.WARNING)
        choice = input().lower().strip()
        if choice in ['y', 'yes', '是']:
            if not self.install_dependencies():
                return False
        
        # 启动服务
        if not self.start_services():
            return False
        
        # 显示URL
        self.show_urls()
        
        print_colored("\n所有服务已启动! 每个服务都在独立的终端窗口中运行", Colors.OKGREEN)
        print_colored("关闭各个终端窗口即可停止对应的服务", Colors.OKGREEN)
        
        return True

def main():
    """主函数"""
    manager = ServiceManager()
    success = manager.run()
    
    if success:
        print_colored("\n程序正常退出", Colors.OKGREEN)
    else:
        print_colored("\n程序异常退出", Colors.FAIL)
        sys.exit(1)

if __name__ == "__main__":
    main()