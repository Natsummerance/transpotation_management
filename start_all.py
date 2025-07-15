#!/usr/bin/env python3
"""
交通管理系统集成启动脚本
同时启动Django后端、CV2人脸识别服务和前端Next.js应用
"""

import os
import sys
import subprocess
import time
import signal
import threading
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
        self.processes = {}
        self.running = True
        self.base_dir = Path(__file__).parent.absolute()
        
        # 设置信号处理
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # 检测操作系统
        self.is_windows = platform.system() == "Windows"
        
    def signal_handler(self, signum, frame):
        """信号处理函数"""
        print_colored("\n正在关闭所有服务...", Colors.WARNING)
        self.running = False
        self.stop_all_services()
        sys.exit(0)
    
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
        npm_paths = [
            'npm',
            'npm.cmd',
            r'C:\Program Files\nodejs\npm.cmd',
            r'C:\Program Files (x86)\nodejs\npm.cmd'
        ]
        
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
            print_colored("错误: npm未找到，尝试使用Node.js内置的npm", Colors.WARNING)
            # 尝试使用Node.js内置的npm
            try:
                result = subprocess.run(['node', '-e', 'console.log(require("npm/package.json").version)'], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    print_status("npm", result.stdout.strip())
                    npm_found = True
                else:
                    print_colored("错误: npm未安装或无法访问", Colors.FAIL)
                    return False
            except Exception:
                print_colored("错误: npm未安装或无法访问", Colors.FAIL)
                return False
        
        return True
    
    def check_directories(self):
        """检查必要的目录和文件"""
        print_header("检查项目结构")
        
        required_dirs = [
            "django_taxi_analysis",
            "face-recognition-cv2-master/face-recognition-cv2-master",
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
            "face-recognition-cv2-master/face-recognition-cv2-master/face_api.py",
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
        for cmd in ['npm', 'npm.cmd', r'C:\Program Files\nodejs\npm.cmd']:
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
    
    def start_django(self):
        """启动Django服务"""
        print_header("启动Django后端服务")
        
        django_dir = self.base_dir / "django_taxi_analysis"
        
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
        
        # 设置环境变量
        env = os.environ.copy()
        env['PYTHONPATH'] = str(django_dir)
        
        try:
            # 检查数据库连接
            print_colored("检查数据库连接...", Colors.OKBLUE)
            check_db_result = subprocess.run([
                str(python_path), "manage.py", "check", "--database", "default"
            ], cwd=django_dir, env=env, capture_output=True, text=True)
            
            if check_db_result.returncode != 0:
                print_colored("警告: 数据库连接检查失败，尝试跳过迁移", Colors.WARNING)
                print_colored(f"错误信息: {check_db_result.stderr}", Colors.WARNING)
                
                # 尝试使用SQLite数据库
                print_colored("尝试使用SQLite数据库...", Colors.OKBLUE)
                self._setup_sqlite_database(django_dir, python_path, env)
            
            # 运行数据库迁移
            print_colored("运行数据库迁移...", Colors.OKBLUE)
            migrate_result = subprocess.run([
                str(python_path), "manage.py", "migrate"
            ], cwd=django_dir, env=env, capture_output=True, text=True)
            
            if migrate_result.returncode != 0:
                print_colored("警告: 数据库迁移失败，但继续启动服务", Colors.WARNING)
                print_colored(f"错误信息: {migrate_result.stderr}", Colors.WARNING)
            
            # 启动Django服务器
            print_colored("启动Django服务器...", Colors.OKBLUE)
            process = subprocess.Popen([
                str(python_path), "manage.py", "runserver", "0.0.0.0:8000"
            ], cwd=django_dir, env=env, 
               stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
               text=True, bufsize=1, universal_newlines=True)
            
            self.processes['django'] = process
            print_status("Django", "启动中... (端口: 8000)")
            
            # 等待Django启动
            time.sleep(3)
            
            return True
            
        except Exception as e:
            print_colored(f"错误: Django启动失败 - {e}", Colors.FAIL)
            return False
    
    def _setup_sqlite_database(self, django_dir, python_path, env):
        """设置SQLite数据库作为备选"""
        try:
            # 创建临时的settings文件
            settings_file = django_dir / "taxi_heatmap" / "settings_sqlite.py"
            sqlite_settings = '''
import os
from .settings import *

# 使用SQLite数据库
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 禁用时区支持以避免问题
USE_TZ = False
'''
            
            with open(settings_file, 'w', encoding='utf-8') as f:
                f.write(sqlite_settings)
            
            # 设置环境变量使用SQLite设置
            env['DJANGO_SETTINGS_MODULE'] = 'taxi_heatmap.settings_sqlite'
            
            print_colored("SQLite数据库设置完成", Colors.OKGREEN)
            
        except Exception as e:
            print_colored(f"设置SQLite数据库失败: {e}", Colors.FAIL)
    
    def start_face_recognition(self):
        """启动CV2人脸识别服务"""
        print_header("启动CV2人脸识别服务")
        
        face_dir = self.base_dir / "face-recognition-cv2-master" / "face-recognition-cv2-master"
        
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
        
        try:
            # 检查必要的文件
            required_files = [
                "face_api.py",
                "haarcascade_frontalface_default.xml"
            ]
            
            for file_name in required_files:
                file_path = face_dir / file_name
                if not file_path.exists():
                    print_colored(f"错误: 缺少文件 {file_name}", Colors.FAIL)
                    return False
            
            # 启动Flask服务
            print_colored("启动人脸识别API服务...", Colors.OKBLUE)
            process = subprocess.Popen([
                str(python_path), "face_api.py"
            ], cwd=face_dir,
               stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
               text=True, bufsize=1, universal_newlines=True)
            
            self.processes['face_recognition'] = process
            print_status("人脸识别", "启动中... (端口: 5000)")
            
            # 等待服务启动
            time.sleep(3)
            
            return True
            
        except Exception as e:
            print_colored(f"错误: 人脸识别服务启动失败 - {e}", Colors.FAIL)
            return False
    
    def start_frontend(self):
        """启动前端Next.js服务"""
        print_header("启动前端Next.js服务")
        
        # 尝试找到npm命令
        npm_cmd = 'npm'
        for cmd in ['npm', 'npm.cmd', r'C:\Program Files\nodejs\npm.cmd']:
            try:
                result = subprocess.run([cmd, '--version'], 
                                      capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    npm_cmd = cmd
                    break
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue
        
        try:
            # 启动Next.js开发服务器
            print_colored("启动Next.js开发服务器...", Colors.OKBLUE)
            process = subprocess.Popen([
                npm_cmd, 'run', 'dev'
            ], cwd=self.base_dir,
               stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
               text=True, bufsize=1, universal_newlines=True)
            
            self.processes['frontend'] = process
            print_status("前端", "启动中... (端口: 3000)")
            
            # 等待服务启动
            time.sleep(5)
            
            return True
            
        except Exception as e:
            print_colored(f"错误: 前端服务启动失败 - {e}", Colors.FAIL)
            return False
    
    def monitor_processes(self):
        """监控进程状态"""
        def monitor():
            while self.running:
                for service_name, process in self.processes.items():
                    if process.poll() is not None:
                        print_colored(f"[{service_name}] 服务已停止 (退出码: {process.returncode})", Colors.WARNING)
                        if self.running:
                            print_colored(f"尝试重启 {service_name} 服务...", Colors.OKBLUE)
                            self.restart_service(service_name)
                time.sleep(5)
        
        monitor_thread = threading.Thread(target=monitor, daemon=True)
        monitor_thread.start()
    
    def restart_service(self, service_name):
        """重启服务"""
        if service_name == 'django':
            self.start_django()
        elif service_name == 'face_recognition':
            self.start_face_recognition()
        elif service_name == 'frontend':
            self.start_frontend()
    
    def stop_all_services(self):
        """停止所有服务"""
        print_colored("\n正在停止所有服务...", Colors.WARNING)
        
        for service_name, process in self.processes.items():
            try:
                print_colored(f"停止 {service_name} 服务...", Colors.OKBLUE)
                if self.is_windows:
                    process.terminate()
                else:
                    process.send_signal(signal.SIGTERM)
                
                # 等待进程结束
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    print_colored(f"强制终止 {service_name} 服务...", Colors.WARNING)
                    process.kill()
                
                print_status(service_name, "已停止")
                
            except Exception as e:
                print_colored(f"停止 {service_name} 服务时出错: {e}", Colors.FAIL)
    
    def show_status(self):
        """显示服务状态"""
        print_header("服务状态")
        
        for service_name, process in self.processes.items():
            if process.poll() is None:
                print_status(service_name, "运行中 ✓")
            else:
                print_colored(f"[{service_name}] 已停止 ✗", Colors.FAIL)
    
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
        print_header("启动所有服务")
        
        # 启动Django
        if not self.start_django():
            return False
        
        # 启动人脸识别服务
        if not self.start_face_recognition():
            return False
        
        # 启动前端
        if not self.start_frontend():
            return False
        
        # 显示状态和URL
        self.show_status()
        self.show_urls()
        
        # 启动监控
        self.monitor_processes()
        
        print_colored("\n所有服务已启动! 按 Ctrl+C 停止所有服务", Colors.OKGREEN)
        
        # 保持程序运行
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            print_colored("\n收到中断信号，正在关闭...", Colors.WARNING)
            self.stop_all_services()
        
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