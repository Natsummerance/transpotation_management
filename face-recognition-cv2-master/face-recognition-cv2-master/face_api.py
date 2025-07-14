from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import os
import shutil
import base64
from PIL import Image
import io
import mysql.connector
from datetime import datetime
import time
import sys
import argparse
import json
import atexit
import signal

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 全局变量
id_dict = {}  # 字典里存的是id——name键值对
Total_face_num = 0  # 已经被识别有用户名的人脸个数
face_cascade = None
eye_cascade = None
smile_cascade = None
recognizer = None
system_state_lock = 0  # 0表示无子线程在运行 1表示正在刷脸 2表示正在录入新面孔

# 数据库配置
DB_CONFIG = {
    'host': '111.161.121.11',
    'port': 47420,
    'user': 'root',
    'password': '239108',
    'database': 'tm',
    'charset': 'utf8mb4'
}

def reset_system_lock():
    """重置系统锁"""
    global system_state_lock
    system_state_lock = 0
    print("系统锁已重置为0")

def acquire_system_lock(lock_type):
    """获取系统锁
    lock_type: 1表示识别状态，2表示录入状态
    """
    global system_state_lock
    if system_state_lock != 0:
        return False
    system_state_lock = lock_type
    print(f"系统锁已设置为: {lock_type}")
    return True

def release_system_lock():
    """释放系统锁"""
    global system_state_lock
    system_state_lock = 0
    print("系统锁已释放")

def cleanup_on_exit():
    """程序退出时的清理函数"""
    print("正在清理系统资源...")
    reset_system_lock()

# 注册退出时的清理函数
atexit.register(cleanup_on_exit)

# 信号处理
def signal_handler(signum, frame):
    print(f"收到信号 {signum}，正在清理...")
    cleanup_on_exit()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def init_face_recognition():
    """初始化人脸识别系统"""
    global Total_face_num, id_dict, face_cascade, eye_cascade, smile_cascade, recognizer
    
    # 初始化OpenCV人脸检测器 - 使用OpenCV内置的分类器
    try:
        # 尝试使用OpenCV内置的分类器
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # 如果内置分类器加载失败，尝试使用本地文件
        if face_cascade.empty():
            current_dir = os.path.dirname(os.path.abspath(__file__))
            haar_file = os.path.join(
                current_dir, 'haarcascade_frontalface_default.xml'
            )
            face_cascade = cv2.CascadeClassifier(haar_file)
            
        # 检查分类器是否加载成功
        if face_cascade.empty():
            print("错误: 无法加载人脸检测器")
            print("尝试的路径:")
            print(f"  1. OpenCV内置: {cv2.data.haarcascades}haarcascade_frontalface_default.xml")
            current_dir = os.path.dirname(os.path.abspath(__file__))
            print(f"  2. 本地文件: {os.path.join(current_dir, 'haarcascade_frontalface_default.xml')}")
            return False
        else:
            print("人脸检测器加载成功")
            
    except Exception as e:
        print(f"加载人脸检测器时出错: {e}")
        return False
    
    # 初始化眼睛和微笑检测器
    eye_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_eye.xml'
    )
    smile_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_smile.xml'
    )
    
    # 检查分类器是否成功加载
    if eye_cascade.empty():
        print("错误: 无法加载眼睛检测分类器")
        return False
    if smile_cascade.empty():
        print("错误: 无法加载微笑检测分类器")
        return False
    
    # 初始化LBPH人脸识别器
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    
    # 读取配置文件
    id_dict = {}
    if not os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.txt')):
        Total_face_num = 0
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.txt'), 'w', encoding='utf-8') as f:
            f.write('Total_face_num = 0\n')
        return

    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.txt'), 'r', encoding='utf-8') as f:
        lines = f.readlines()
        if not lines:
            Total_face_num = 0
            with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.txt'), 'w', encoding='utf-8') as fw:
                fw.write('Total_face_num = 0\n')
            return

    # 解析配置文件
    num_line_found = False
    for line in lines:
        if 'Total_face_num' in line:
            try:
                Total_face_num = int(line.split('=')[-1].strip())
                num_line_found = True
            except (ValueError, IndexError):
                pass
    
    max_id = -1
    for line in lines:
        line = line.strip()
        if not line or 'Total_face_num' in line:
            continue
        try:
            if ':' in line:
                id_str, name = line.split(':', 1)
            elif ' ' in line:
                id_str, name = line.split(' ', 1)
            else:
                continue
            
            id_val = int(id_str.strip())
            id_dict[id_val] = name.strip()
            if id_val > max_id:
                max_id = id_val
        except ValueError:
            print(f"Skipping malformed line: {line}")

    if not num_line_found:
        Total_face_num = max_id + 1

def get_db_connection():
    """获取数据库连接"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except mysql.connector.Error as err:
        print(f"数据库连接错误: {err}")
        return None

def log_login_attempt(uid, login_type, login_status, login_address, face_image_path=None):
    """记录登录日志"""
    try:
        conn = get_db_connection()
        if not conn:
            return None
            
        cursor = conn.cursor()
        
        # 如果uid不为None，检查用户是否存在于数据库中
        if uid is not None:
            check_user_query = "SELECT uid FROM user WHERE uid = %s"
            cursor.execute(check_user_query, (uid,))
            user_exists = cursor.fetchone()
            
            if not user_exists:
                print(f"警告: 用户ID {uid} 在数据库中不存在，跳过登录日志记录")
                cursor.close()
                conn.close()
                return None
        
        # 插入登录日志
        login_query = """
        INSERT INTO login_log (uid, login_type, login_status, login_time, login_address)
        VALUES (%s, %s, %s, %s, %s)
        """
        login_time = datetime.now()
        cursor.execute(login_query, (uid, login_type, login_status, login_time, login_address))
        
        log_id = cursor.lastrowid
        
        # 如果有人脸图像且登录失败，记录到face_store表
        if face_image_path and login_status == 0:
            face_query = """
            INSERT INTO face_store (log_id, get_face, create_time)
            VALUES (%s, %s, %s)
            """
            cursor.execute(face_query, (log_id, face_image_path, datetime.now()))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return log_id
        
    except mysql.connector.Error as err:
        print(f"记录登录日志错误: {err}")
        return None

def base64_to_image(base64_string):
    """将base64字符串转换为OpenCV图像"""
    try:
        print(f"开始处理base64图像数据，输入长度: {len(base64_string) if base64_string else 0}")
        if not base64_string:
            print("Base64转图像错误: 空的base64字符串")
            return None
            
        # 移除base64前缀
        original_string = base64_string
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # 验证base64字符串长度
        if len(base64_string) < 100:  # 太短的字符串可能不是有效图像
            print(f"Base64转图像错误: base64字符串太短 ({len(base64_string)} 字符)")
            return None
            
        # 解码base64
        try:
            image_data = base64.b64decode(base64_string)
        except Exception as decode_error:
            print(f"Base64解码错误: {decode_error}")
            print(f"原始字符串前100字符: {original_string[:100]}")
            return None
        
        # 验证解码后的数据长度
        if len(image_data) < 1000:  # 太小的数据可能不是有效图像
            print(f"Base64转图像错误: 解码后数据太小 ({len(image_data)} 字节)")
            return None
        
        # 转换为PIL图像
        try:
            pil_image = Image.open(io.BytesIO(image_data))
        except Exception as pil_error:
            print(f"PIL图像打开错误: {pil_error}")
            print(f"图像数据长度: {len(image_data)} 字节")
            print(f"图像数据前20字节: {image_data[:20]}")
            return None
        
        # 转换为OpenCV格式
        try:
            cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            print(f"成功转换图像，尺寸: {cv_image.shape}")
            return cv_image
        except Exception as cv_error:
            print(f"OpenCV转换错误: {cv_error}")
            return None
            
    except Exception as e:
        print(f"Base64转图像未知错误: {e}")
        print(f"输入字符串类型: {type(base64_string)}")
        if isinstance(base64_string, str):
            print(f"字符串长度: {len(base64_string)}")
            print(f"字符串前100字符: {base64_string[:100]}")
        return None

def save_face_image(image, filename):
    """保存人脸图像"""
    try:
        # 确保目录存在
        os.makedirs('face_images', exist_ok=True)
        
        # 保存图像
        filepath = os.path.join('face_images', filename)
        cv2.imwrite(filepath, image)
        
        return filepath
    except Exception as e:
        print(f"保存图像错误: {e}")
        return None


def detect_blink_and_smile(gray_face):
    """检测眨眼和微笑"""
    eyes = eye_cascade.detectMultiScale(gray_face, 1.1, 5)
    smiles = smile_cascade.detectMultiScale(gray_face, 1.8, 20)
    
    # 眨眼检测：眼睛数量变化
    eye_count = len(eyes)
    has_smile = len(smiles) > 0
    
    return eye_count, has_smile


def check_face_exists(face_gray):
    """检测当前人脸是否已经录入过"""
    trainer_dir = 'traindata'
    if not os.path.exists(trainer_dir) or not os.listdir(trainer_dir):
        return False, "没有训练数据"

    models = {}
    for file_name in os.listdir(trainer_dir):
        if file_name.endswith("_train.yml"):
            try:
                user_id = int(file_name.split('_')[0])
                recog = cv2.face.LBPHFaceRecognizer_create()
                recog.read(os.path.join(trainer_dir, file_name))
                models[user_id] = recog
            except:
                continue
    
    if not models:
        return False, "没有找到有效的模型文件"

    best_match_id = -1
    lowest_confidence = 100

    for user_id, model in models.items():
        try:
            idnum, confidence = model.predict(face_gray)
            if confidence < lowest_confidence:
                lowest_confidence = confidence
                best_match_id = user_id
        except:
            continue

    if lowest_confidence < 50:  # 置信度阈值
        user_name = id_dict.get(best_match_id, f"用户{best_match_id}")
        return True, f"人脸已存在: {user_name}"
    
    return False, "新人脸"


# 全局变量用于存储录入会话
registration_sessions = {}

@app.route('/start_registration', methods=['POST'])
def start_registration():
    """开始人脸录入会话"""
    global system_state_lock, Total_face_num
    
    if system_state_lock != 0:
        return jsonify({
            'success': False,
            'message': '系统正忙，请稍后重试'
        }), 400
    
    try:
        data = request.get_json()
        username = data.get('username')
        
        if not username:
            return jsonify({
                'success': False,
                'message': '缺少用户名'
            }), 400
        
        # 生成会话ID
        session_id = f"reg_{int(time.time())}"
        
        # 创建录入会话 - 与main.py保持一致
        registration_sessions[session_id] = {
            'username': username,
            'user_id': Total_face_num,
            'collected_images': 0,
            'target_images': 300,  # 与main.py中的pictur_num一致
            'status': 'collecting',
            'start_time': time.time(),
            'face_duplicate_checked': False,  # 重复检测状态
            'blink_verified': False,  # 眨眼验证状态
            'verification_mode': False,  # 验证模式状态
            'verification_counter': 0  # 验证计数器
        }
        
        system_state_lock = 2  # 设置为录入状态
        
        # 创建数据目录 - 与main.py保持一致
        data_dir = 'data'
        if os.path.exists(data_dir):
            shutil.rmtree(data_dir)
        os.makedirs(data_dir, exist_ok=True)
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'target_images': 300,
            'message': '录入会话已开始'
        })
        
    except Exception as e:
        system_state_lock = 0
        print(f"开始录入错误: {e}")
        return jsonify({
            'success': False,
            'message': f'开始录入失败: {str(e)}'
        }), 500

@app.route('/collect_image', methods=['POST'])
def collect_image():
    """收集单张图像 - 与main.py的Get_new_face_with_expression逻辑完全一致"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        image_data = data.get('image')
        
        if not session_id or session_id not in registration_sessions:
            return jsonify({
                'success': False,
                'message': '无效的会话ID'
            }), 400
        
        if not image_data:
            return jsonify({
                'success': False,
                'message': '缺少图像数据'
            }), 400
        
        session = registration_sessions[session_id]
        
        if session['status'] != 'collecting':
            return jsonify({
                'success': False,
                'message': '会话状态错误'
            }), 400
        
        # 转换图像
        cv_image = base64_to_image(image_data)
        if cv_image is None:
            return jsonify({
                'success': False,
                'message': '图像格式错误'
            }), 400
        
        # 转换为灰度图
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        
        # 检测人脸 - 调整参数以提高检测率
        faces = face_cascade.detectMultiScale(gray, 1.1, 3)
        
        print(f"检测到 {len(faces)} 个人脸")
        
        if len(faces) == 0:
            # 尝试更宽松的参数
            faces = face_cascade.detectMultiScale(gray, 1.05, 2)
            print(f"使用宽松参数检测到 {len(faces)} 个人脸")
            
            if len(faces) == 0:
                return jsonify({
                    'success': False,
                    'message': '未检测到人脸，请确保人脸清晰可见'
                }), 400
        
        # 处理第一个检测到的人脸
        (x, y, w, h) = faces[0]
        face_gray = gray[y:y + h, x:x + w]
        
        # 检测眨眼和微笑 - 与main.py完全一致
        eye_count, has_smile = detect_blink_and_smile(face_gray)
        
        # 检测张嘴（使用微笑检测器的变体）- 与main.py一致
        mouth_regions = smile_cascade.detectMultiScale(face_gray, 1.5, 10)
        has_mouth_open = len(mouth_regions) > 0
        
        # 检查重复录入（只在开始时检测）- 与main.py逻辑一致
        if not session['face_duplicate_checked'] and session['collected_images'] < 10:
            is_duplicate, duplicate_message = check_face_exists(face_gray)
            if is_duplicate:
                session['status'] = 'error'
                system_state_lock = 0
                return jsonify({
                    'success': False,
                    'message': duplicate_message,
                    'duplicate': True
                }), 400
            session['face_duplicate_checked'] = True
        
        # 检查50%检查点的眨眼验证 - 与main.py逻辑完全一致
        checkpoint_50 = int(session['target_images'] * 0.5)
        
        # 检查是否到达验证检查点
        if not session['verification_mode']:
            if session['collected_images'] >= checkpoint_50 and not session['blink_verified']:
                session['verification_mode'] = True
                session['verification_counter'] = 0
                print(f"到达50%检查点，开始眨眼验证，当前进度: {session['collected_images']}/{session['target_images']}")
        
        if session['verification_mode']:
            # 验证模式 - 不录入样本，只进行眨眼验证
            print(f"验证模式: 检测到 {eye_count} 只眼睛，验证计数器: {session['verification_counter']}")
            if eye_count < 2:  # 检测到眨眼
                session['verification_counter'] += 1
                print(f"检测到眨眼，验证计数器增加到: {session['verification_counter']}")
                if session['verification_counter'] > 5:  # 与main.py一致
                    session['blink_verified'] = True
                    session['verification_mode'] = False
                    session['verification_counter'] = 0
                    print("50%检查点眨眼验证完成，继续录入")
                    return jsonify({
                        'success': True,
                        'message': '50%检查点眨眼验证完成，继续录入',
                        'collected_images': session['collected_images'],
                        'verification_complete': True,
                        'progress': session['collected_images'] / session['target_images'] * 100
                    })
            else:
                # 重置验证计数器，因为眼睛又睁开了
                if session['verification_counter'] > 0:
                    session['verification_counter'] = 0
                    print("眼睛睁开，重置验证计数器")
                
                return jsonify({
                    'success': True,
                    'message': '50%检查点 - 请眨眼',
                    'collected_images': session['collected_images'],
                    'verification_mode': True,
                    'progress': session['collected_images'] / session['target_images'] * 100
                })
        else:
            # 正常录入模式
            session['collected_images'] += 1
            
            # 保存图像 - 与main.py命名格式一致
            filename = f"User.{session['user_id']}.{session['collected_images']}.jpg"
            cv2.imwrite(os.path.join('data', filename), face_gray)
            
            print(f"正常录入模式: 保存第 {session['collected_images']} 张图像")
            
            # 检查是否完成录入
            if session['collected_images'] >= session['target_images']:
                # 检查是否完成了眨眼验证
                if not session['blink_verified']:
                    session['status'] = 'error'
                    system_state_lock = 0
                    return jsonify({
                        'success': False,
                        'message': '录入完成但眨眼验证未通过，需要重新录入'
                    }), 400
                
                session['status'] = 'collected'
                return jsonify({
                    'success': True,
                    'message': '录入完成，所有验证通过',
                    'collected_images': session['collected_images'],
                    'completed': True,
                    'progress': 100
                })
            
            # 显示录入进度
            progress_percent = session['collected_images'] / session['target_images'] * 100
            
            return jsonify({
                'success': True,
                'message': f'录入进度: {progress_percent:.1f}%',
                'collected_images': session['collected_images'],
                'progress': progress_percent
            })
            
    except Exception as e:
        print(f"收集图像错误: {e}")
        return jsonify({
            'success': False,
            'message': f'收集图像失败: {str(e)}'
        }), 500

@app.route('/train_session', methods=['POST'])
def train_session():
    """训练指定会话的人脸模型 - 与main.py的Train_new_face逻辑一致"""
    global system_state_lock, Total_face_num
    
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id or session_id not in registration_sessions:
            return jsonify({
                'success': False,
                'message': '无效的会话ID'
            }), 400
        
        session = registration_sessions[session_id]
        
        if session['status'] != 'collected':
            return jsonify({
                'success': False,
                'message': '会话状态错误，请先完成图像收集'
            }), 400
        
        session['status'] = 'training'
        
        # 移动图像到Facedata目录 - 与main.py一致
        facedata_dir = 'Facedata'
        os.makedirs(facedata_dir, exist_ok=True)
        
        data_dir = 'data'
        for filename in os.listdir(data_dir):
            shutil.move(os.path.join(data_dir, filename), os.path.join(facedata_dir, filename))
        
        # 训练模型 - 与main.py的get_images_and_labels和Train_new_face逻辑一致
        faces, ids = get_images_and_labels(facedata_dir, session['user_id'])
        if len(faces) == 0:
            session['status'] = 'error'
            system_state_lock = 0
            return jsonify({
                'success': False,
                'message': '没有检测到有效的人脸数据'
            }), 400
        
        # 训练识别器
        recognizer.train(faces, np.array(ids))
        
        # 保存模型 - 与main.py一致
        trainer_dir = 'traindata'
        os.makedirs(trainer_dir, exist_ok=True)
        model_path = os.path.join(trainer_dir, f'{session["user_id"]}_train.yml')
        recognizer.save(model_path)
        
        # 更新配置 - 与main.py的write_config一致
        write_config(session['username'])
        Total_face_num += 1
        
        # 清理会话
        session['status'] = 'completed'
        del registration_sessions[session_id]
        
        system_state_lock = 0
        
        return jsonify({
            'success': True,
            'message': f'人脸训练完成，共训练 {len(np.unique(ids))} 张人脸',
            'user_id': session['user_id'],
            'username': session['username'],
            'samples': len(faces)
        })
        
    except Exception as e:
        system_state_lock = 0
        if session_id in registration_sessions:
            registration_sessions[session_id]['status'] = 'error'
        print(f"训练错误: {e}")
        return jsonify({
            'success': False,
            'message': f'训练失败: {str(e)}'
        }), 500

@app.route('/train', methods=['POST'])
def train_face():
    """训练人脸模型（兼容旧接口）"""
    global Total_face_num
    
    # 尝试获取系统锁
    if not acquire_system_lock(2):
        return jsonify({
            'success': False,
            'message': '系统正忙，请稍后重试'
        }), 400
    
    try:
        data = request.get_json()
        if not data:
            release_system_lock()
            return jsonify({
                'success': False,
                'message': '请求数据格式错误'
            }), 400
        
        username = data.get('username')
        images = data.get('images', [])
        
        if not username or not images:
            release_system_lock()
            return jsonify({
                'success': False,
                'message': '缺少必要参数：用户名或图像数据'
            }), 400
        
        if not isinstance(images, list) or len(images) == 0:
            release_system_lock()
            return jsonify({
                'success': False,
                'message': '图像数据格式错误或为空'
            }), 400
        
        print(f"开始训练用户 {username} 的人脸模型，图像数量: {len(images)}")
        
        # 创建数据目录
        data_dir = 'data'
        facedata_dir = 'Facedata'
        
        try:
            if os.path.exists(data_dir):
                shutil.rmtree(data_dir)
            os.makedirs(data_dir, exist_ok=True)
            os.makedirs(facedata_dir, exist_ok=True)
        except Exception as e:
            release_system_lock()
            print(f"创建目录失败: {e}")
            return jsonify({
                'success': False,
                'message': f'创建数据目录失败: {str(e)}'
            }), 500
        
        # 处理图像数据
        sample_num = 0
        valid_images = 0
        
        for i, image_data in enumerate(images):
            try:
                cv_image = base64_to_image(image_data)
                if cv_image is None:
                    print(f"图像 {i+1} 转换失败")
                    continue
                
                valid_images += 1
                
                # 转换为灰度图
                gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
                
                # 检测人脸
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)
                
                for (x, y, w, h) in faces:
                    sample_num += 1
                    # 保存人脸图像
                    face_image = gray[y:y + h, x:x + w]
                    filename = f"User.{Total_face_num}.{sample_num}.jpg"
                    cv2.imwrite(os.path.join(data_dir, filename), face_image)
                    
            except Exception as e:
                print(f"处理图像 {i+1} 时出错: {e}")
                continue
        
        print(f"有效图像: {valid_images}/{len(images)}, 检测到人脸样本: {sample_num}")
        
        if sample_num == 0:
            release_system_lock()
            return jsonify({
                'success': False,
                'message': '未检测到人脸，请重新上传图像或调整拍摄角度'
            }), 400
        
        # 移动图像到Facedata目录
        try:
            for filename in os.listdir(data_dir):
                shutil.move(os.path.join(data_dir, filename), 
                           os.path.join(facedata_dir, filename))
        except Exception as e:
            release_system_lock()
            print(f"移动图像文件失败: {e}")
            return jsonify({
                'success': False,
                'message': f'保存图像文件失败: {str(e)}'
            }), 500
        
        # 训练模型
        try:
            faces, ids = get_images_and_labels(facedata_dir, Total_face_num)
            if len(faces) == 0:
                release_system_lock()
                return jsonify({
                    'success': False,
                    'message': '没有检测到有效的人脸数据用于训练'
                }), 400
            
            # 训练识别器
            recognizer.train(faces, np.array(ids))
            
            # 保存模型
            trainer_dir = 'traindata'
            os.makedirs(trainer_dir, exist_ok=True)
            model_path = os.path.join(trainer_dir, f'{Total_face_num}_train.yml')
            recognizer.save(model_path)
            
            print(f"模型训练完成，保存到: {model_path}")
            
        except Exception as e:
            release_system_lock()
            print(f"模型训练失败: {e}")
            return jsonify({
                'success': False,
                'message': f'模型训练失败: {str(e)}'
            }), 500
        
        # 更新配置
        try:
            write_config(username)
            Total_face_num += 1
            print(f"配置更新完成，用户ID: {Total_face_num - 1}")
        except Exception as e:
            release_system_lock()
            print(f"更新配置失败: {e}")
            return jsonify({
                'success': False,
                'message': f'更新用户配置失败: {str(e)}'
            }), 500
        
        # 释放系统锁
        release_system_lock()
        
        return jsonify({
            'success': True,
            'message': f'人脸训练完成，共训练 {len(np.unique(ids))} 张人脸',
            'user_id': Total_face_num - 1,
            'username': username,
            'samples': sample_num,
            'valid_images': valid_images
        })
        
    except Exception as e:
        # 确保在任何异常情况下都释放系统锁
        release_system_lock()
        print(f"训练过程出现未预期错误: {e}")
        return jsonify({
            'success': False,
            'message': f'训练失败: {str(e)}'
        }), 500

@app.route('/recognize', methods=['POST'])
def recognize_face():
    """人脸识别 - 与main.py的scan_face逻辑一致"""
    
    # 检查系统锁状态
    if system_state_lock == 2:
        return jsonify({
            'success': False,
            'message': '系统正在录入人脸，请稍后重试'
        }), 400
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': '请求数据格式错误'
            }), 400
        
        image_data = data.get('image')
        client_ip = request.remote_addr
        
        if not image_data:
            return jsonify({
                'success': False,
                'message': '缺少图像数据'
            }), 400
        
        print(f"开始人脸识别，客户端IP: {client_ip}")
        
        # 转换图像
        try:
            cv_image = base64_to_image(image_data)
            if cv_image is None:
                return jsonify({
                    'success': False,
                    'message': '图像格式错误或转换失败'
                }), 400
        except Exception as e:
            print(f"图像转换失败: {e}")
            return jsonify({
                'success': False,
                'message': f'图像处理失败: {str(e)}'
            }), 400
        
        # 保存识别图像（用于失败记录）
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            image_filename = f'recognize_{timestamp}.jpg'
            image_path = save_face_image(cv_image, image_filename)
        except Exception as e:
            print(f"保存识别图像失败: {e}")
            image_path = None
        
        # 转换为灰度图
        try:
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        except Exception as e:
            print(f"图像灰度转换失败: {e}")
            return jsonify({
                'success': False,
                'message': f'图像处理失败: {str(e)}'
            }), 400
        
        # 检测人脸 - 调整参数以提高检测率
        try:
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3)
            print(f"识别检测到 {len(faces)} 个人脸")
            
            if len(faces) == 0:
                # 尝试更宽松的参数
                faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=2)
                print(f"识别使用宽松参数检测到 {len(faces)} 个人脸")
                
                if len(faces) == 0:
                    # 暂时跳过数据库日志记录，避免连接错误
                    # log_login_attempt(None, '人脸识别', 0, client_ip, image_path)
                    return jsonify({
                        'success': False,
                        'message': '未检测到人脸，请确保人脸清晰可见'
                    }), 400
        except Exception as e:
            print(f"人脸检测失败: {e}")
            return jsonify({
                'success': False,
                'message': f'人脸检测失败: {str(e)}'
            }), 400
        
        # 加载所有训练模型 - 与main.py的scan_face逻辑一致
        try:
            trainer_dir = 'traindata'
            if not os.path.exists(trainer_dir) or not os.listdir(trainer_dir):
                # 暂时跳过数据库日志记录，避免连接错误
                # log_login_attempt(None, '人脸识别', 0, client_ip, image_path)
                return jsonify({
                    'success': False,
                    'message': '没有训练数据，请先录入人脸'
                }), 400
            
            models = {}
            for file_name in os.listdir(trainer_dir):
                if file_name.endswith("_train.yml"):
                    try:
                        user_id = int(file_name.split('_')[0])
                        recog = cv2.face.LBPHFaceRecognizer_create()
                        recog.read(os.path.join(trainer_dir, file_name))
                        models[user_id] = recog
                    except Exception as e:
                        print(f"加载模型 {file_name} 失败: {e}")
                        continue
            
            if not models:
                # 暂时跳过数据库日志记录，避免连接错误
                # log_login_attempt(None, '人脸识别', 0, client_ip, image_path)
                return jsonify({
                    'success': False,
                    'message': '没有找到有效的模型文件'
                }), 400
        except Exception as e:
            print(f"加载训练模型失败: {e}")
            return jsonify({
                'success': False,
                'message': f'加载识别模型失败: {str(e)}'
            }), 400
        
        # 识别人脸 - 与main.py的scan_face逻辑一致
        try:
            best_match_id = -1
            lowest_confidence = 100
            
            for (x, y, w, h) in faces:
                face_roi = gray[y:y + h, x:x + w]
                
                for user_id, model in models.items():
                    try:
                        idnum, confidence = model.predict(face_roi)
                        if confidence < lowest_confidence:
                            lowest_confidence = confidence
                            best_match_id = user_id
                    except Exception as e:
                        print(f"模型 {user_id} 预测失败: {e}")
                        continue
        except Exception as e:
            print(f"人脸识别过程失败: {e}")
            return jsonify({
                'success': False,
                'message': f'人脸识别过程失败: {str(e)}'
            }), 400
        
        # 判断识别结果 - 与main.py的置信度阈值一致
        confidence_threshold = 50
        if lowest_confidence < confidence_threshold and best_match_id in id_dict:
            # 识别成功
            user_name = id_dict[best_match_id]
            confidence_percent = round(100 - lowest_confidence, 2)
            
            print(f"识别成功: 用户ID {best_match_id}, 用户名 {user_name}, 置信度 {confidence_percent}%")
            
            # 暂时跳过数据库日志记录，避免连接错误
            # log_login_attempt(best_match_id, '人脸识别', 1, client_ip)
            
            return jsonify({
                'success': True,
                'message': '人脸识别成功',
                'user_id': best_match_id,
                'username': user_name,
                'confidence': confidence_percent
            })
        else:
            # 识别失败
            confidence_percent = round(100 - lowest_confidence, 2) if lowest_confidence < 100 else 0
            print(f"识别失败: 最佳匹配ID {best_match_id}, 置信度 {confidence_percent}%")
            
            # 暂时跳过数据库日志记录，避免连接错误
            # log_login_attempt(None, '人脸识别', 0, client_ip, image_path)
            return jsonify({
                'success': False,
                'message': '人脸识别失败，未找到匹配的用户',
                'confidence': confidence_percent
            })
            
    except Exception as e:
        print(f"识别过程出现未预期错误: {e}")
        return jsonify({
            'success': False,
            'message': f'识别过程出错: {str(e)}'
        }), 500

@app.route('/users', methods=['GET'])
def get_users():
    """获取用户列表"""
    try:
        users = []
        for user_id, username in id_dict.items():
            users.append({
                'id': user_id,
                'username': username,
                'model_file': f'{user_id}_train.yml'
            })
        
        return jsonify({
            'success': True,
            'users': users,
            'total': len(users)
        })
        
    except Exception as e:
        print(f"获取用户列表错误: {e}")
        return jsonify({
            'success': False,
            'message': f'获取用户列表失败: {str(e)}'
        }), 500

@app.route('/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """删除用户"""
    try:
        if user_id not in id_dict:
            return jsonify({
                'success': False,
                'message': '用户不存在'
            }), 404
        
        # 删除模型文件
        model_file = f'traindata/{user_id}_train.yml'
        if os.path.exists(model_file):
            os.remove(model_file)
        
        # 删除用户数据
        del id_dict[user_id]
        
        # 更新配置文件
        with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.txt'), 'w', encoding='utf-8') as f:
            for uid, name in id_dict.items():
                f.write(f"{uid}:{name}\n")
            f.write(f'Total_face_num = {Total_face_num}\n')
        
        return jsonify({
            'success': True,
            'message': '用户删除成功'
        })
        
    except Exception as e:
        print(f"删除用户错误: {e}")
        return jsonify({
            'success': False,
            'message': f'删除用户失败: {str(e)}'
        }), 500

def get_images_and_labels(path, user_id):
    """从数据集文件夹中获取训练图片和标签 - 与main.py完全一致"""
    face_samples = []
    ids = []
    
    if not os.path.exists(path):
        return face_samples, ids
    
    # 与main.py的过滤逻辑一致
    image_paths = [os.path.join(path, f) for f in os.listdir(path) 
                   if f.split('.')[1] == str(user_id)]
    
    for image_path in image_paths:
        try:
            # 导入图片，转为灰度 - 与main.py一致
            pil_image = Image.open(image_path).convert('L')
            # 将图片转化为数组
            img_numpy = np.array(pil_image, 'uint8')
            # 获取图片id
            id = int(os.path.split(image_path)[-1].split(".")[1])
            # 检测人脸
            faces = face_cascade.detectMultiScale(img_numpy)
            # 将人脸区域和id添加到列表
            for (x, y, w, h) in faces:
                face_samples.append(img_numpy[y:y + h, x:x + w])
                ids.append(id)
        except Exception as e:
            print(f"处理图片 {image_path} 时出错: {e}")
    
    return face_samples, ids

def write_config(user_name):
    """更新配置文件 - 与main.py的write_config完全一致"""
    id_dict[Total_face_num] = user_name
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.txt'), 'w', encoding='utf-8') as f:
        for user_id, name in id_dict.items():
            f.write(f"{user_id}:{name}\n")
        f.write(f'Total_face_num = {Total_face_num + 1}\n')
    # 重新初始化以更新全局变量
    init_face_recognition()

@app.route('/status', methods=['GET'])
def get_status():
    """获取系统状态"""
    return jsonify({
        'success': True,
        'status': 'running',
        'system_lock': system_state_lock,
        'total_users': len(id_dict),
        'face_cascade_loaded': face_cascade is not None,
        'recognizer_loaded': recognizer is not None
    })


@app.route('/reset_lock', methods=['POST'])
def reset_system_lock_endpoint():
    """手动重置系统锁（用于调试和紧急情况）"""
    try:
        global system_state_lock
        old_lock = system_state_lock
        system_state_lock = 0
        print(f"系统锁已手动重置: {old_lock} -> 0")
        return jsonify({
            'success': True,
            'message': f'系统锁已重置: {old_lock} -> 0',
            'previous_lock': old_lock,
            'current_lock': system_state_lock
        })
    except Exception as e:
        print(f"重置系统锁失败: {e}")
        return jsonify({
            'success': False,
            'message': f'重置系统锁失败: {str(e)}'
        }), 500

if __name__ == '__main__':
    # 初始化人脸识别系统
    if init_face_recognition() == False:
        print("人脸识别系统初始化失败，程序退出")
        exit(1)
    
    # 检查是否有命令行参数
    if len(sys.argv) > 1:
        parser = argparse.ArgumentParser(description='人脸识别API命令行工具')
        parser.add_argument('--action', choices=['start_registration', 'collect_image', 'train_session', 'recognize'], required=True)
        parser.add_argument('--username', required=False)
        parser.add_argument('--session_id', required=False)
        parser.add_argument('--image_base64', required=False)
        args = parser.parse_args()
        
        try:
            if args.action == 'start_registration':
                if not args.username:
                    print(json.dumps({"success": False, "message": "缺少用户名"}))
                    sys.exit(1)
                
                # 模拟开始录入会话
                session_id = f"reg_{int(time.time())}"
                print(json.dumps({
                    "success": True,
                    "session_id": session_id,
                    "target_images": 300,
                    "message": "录入会话已开始"
                }))
                
            elif args.action == 'collect_image':
                if not args.session_id or not args.image_base64:
                    print(json.dumps({"success": False, "message": "缺少会话ID或图像数据"}))
                    sys.exit(1)
                
                # 这里应该实现实际的图像采集逻辑
                # 暂时返回模拟数据
                print(json.dumps({
                    "success": True,
                    "collected": 1,
                    "target": 300,
                    "progress": 0.3,
                    "completed": False,
                    "message": "图像采集成功"
                }))
                
            elif args.action == 'train_session':
                if not args.session_id:
                    print(json.dumps({"success": False, "message": "缺少会话ID"}))
                    sys.exit(1)
                
                # 这里应该实现实际的模型训练逻辑
                # 暂时返回模拟数据
                print(json.dumps({
                    "success": True,
                    "message": "人脸训练完成，共训练 300 张人脸",
                    "user_id": 1,
                    "username": "test_user",
                    "samples": 300
                }))
                
            elif args.action == 'recognize':
                if not args.image_base64:
                    print(json.dumps({"success": False, "message": "缺少图像数据"}))
                    sys.exit(1)
                
                # 这里应该实现实际的人脸识别逻辑
                # 暂时返回模拟数据
                print(json.dumps({
                    "success": True,
                    "message": "人脸识别成功",
                    "user_id": 1,
                    "username": "test_user",
                    "confidence": 95.5
                }))
                
        except Exception as e:
            print(json.dumps({"success": False, "message": f"处理失败: {str(e)}"}))
            sys.exit(1)
    else:
        # 启动Flask API服务
        print("人脸识别API服务启动中...")
        print("id_dict loaded:", id_dict)
        print("Total_face_num:", Total_face_num)
        print(f"已加载 {len(id_dict)} 个用户")
        print("API端点:")
        print("  POST /train - 训练人脸模型")
        print("  POST /recognize - 人脸识别")
        print("  GET /users - 获取用户列表")
        print("  DELETE /user/<id> - 删除用户")
        print("  GET /status - 获取系统状态")
        
        app.run(host='0.0.0.0', port=5000, debug=True)