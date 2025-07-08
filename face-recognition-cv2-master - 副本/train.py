import cv2
import numpy as np
import os
import base64
import threading
from flask import Flask, request, jsonify
import shutil

app = Flask(__name__)

# 初始化全局变量
id_dict = {}
face_cascade = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")
system_state_lock = threading.Lock()
trainer_dir = 'traindata'
face_data_dir = 'Facedata'

# 创建必要的目录
os.makedirs(trainer_dir, exist_ok=True)
os.makedirs(face_data_dir, exist_ok=True)

# 初始化配置
def init_config():
    global id_dict
    config_path = 'config.txt'
    if not os.path.exists(config_path):
        return
    
    with open(config_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if ':' in line:
                parts = line.split(':', 1)
                try:
                    user_id = int(parts[0].strip())
                    username = parts[1].strip()
                    id_dict[user_id] = username
                except ValueError:
                    continue

# 初始化配置
init_config()

# 训练模型接口
@app.route('/train', methods=['POST'])
def train_model():
    try:
        # 获取请求数据
        data = request.json
        user_id = data['user_id']
        username = data['username']
        images = data['images']  # base64编码的图片列表
        
        # 创建用户目录
        user_dir = os.path.join(face_data_dir, f'User.{user_id}')
        os.makedirs(user_dir, exist_ok=True)
        
        # 保存并处理图片
        face_samples = []
        for i, img_data in enumerate(images):
            # 去除base64前缀
            if ',' in img_data:
                img_data = img_data.split(',')[1]
                
            img_bytes = base64.b64decode(img_data)
            nparr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                continue
                
            # 转换为灰度图并检测人脸
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
            
            for (x, y, w, h) in faces:
                # 保存人脸区域
                face_img = gray[y:y+h, x:x+w]
                face_samples.append(face_img)
                cv2.imwrite(os.path.join(user_dir, f'{i}.jpg'), face_img)
        
        if not face_samples:
            return jsonify({"success": False, "message": "未检测到有效人脸"}), 400
        
        # 训练模型
        ids = [user_id] * len(face_samples)
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        model_path = os.path.join(trainer_dir, f'{user_id}_train.yml')
        
        # 如果模型已存在，则更新；否则创建新模型
        if os.path.exists(model_path):
            recognizer.read(model_path)
            recognizer.update(face_samples, np.array(ids))
        else:
            recognizer.train(face_samples, np.array(ids))
        
        recognizer.save(model_path)
        
        # 更新配置文件
        id_dict[user_id] = username
        with open('config.txt', 'a', encoding='utf-8') as f:
            f.write(f"{user_id}:{username}\n")
        
        return jsonify({
            "success": True,
            "message": f"用户 {username} (ID: {user_id}) 训练完成",
            "trained_samples": len(face_samples)
        })
    
    except Exception as e:
        return jsonify({"success": False, "message": f"训练失败: {str(e)}"}), 500

# 识别接口
@app.route('/recognize', methods=['POST'])
def recognize_face():
    try:
        # 获取请求数据
        data = request.json
        image_data = data['image']
        
        # 解码图片
        if ',' in image_data:
            image_data = image_data.split(',')[1]
            
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({"success": False, "message": "图片解码失败"}), 400
        
        # 转换为灰度图并检测人脸
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.2, 
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        if len(faces) == 0:
            return jsonify({"success": False, "message": "未检测到人脸"}), 400
        
        # 识别结果
        results = []
        for (x, y, w, h) in faces:
            face_roi = gray[y:y+h, x:x+w]
            
            best_match = {"user_id": -1, "username": "unknown", "confidence": float('inf')}
            
            # 检查所有训练模型
            for model_file in os.listdir(trainer_dir):
                if model_file.endswith('_train.yml'):
                    try:
                        user_id = int(model_file.split('_')[0])
                        recognizer = cv2.face.LBPHFaceRecognizer_create()
                        recognizer.read(os.path.join(trainer_dir, model_file))
                        
                        label, confidence = recognizer.predict(face_roi)
                        
                        # 更新最佳匹配
                        if confidence < best_match["confidence"]:
                            best_match = {
                                "user_id": user_id,
                                "username": id_dict.get(user_id, f"未知用户{user_id}"),
                                "confidence": confidence
                            }
                    except Exception as e:
                        print(f"加载模型 {model_file} 失败: {str(e)}")
                        continue
            
            # 添加到结果
            results.append({
                "box": [int(x), int(y), int(w), int(h)],
                "user_id": best_match["user_id"],
                "username": best_match["username"],
                "confidence": float(best_match["confidence"])
            })
        
        return jsonify({
            "success": True,
            "results": results
        })
    
    except Exception as e:
        return jsonify({"success": False, "message": f"识别失败: {str(e)}"}), 500

# 获取用户列表接口
@app.route('/users', methods=['GET'])
def get_users():
    return jsonify({
        "success": True,
        "users": [{"id": k, "name": v} for k, v in id_dict.items()]
    })

# 删除用户接口
@app.route('/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        # 删除配置文件中的用户
        if user_id in id_dict:
            del id_dict[user_id]
            
            # 重写配置文件
            with open('config.txt', 'w', encoding='utf-8') as f:
                for uid, name in id_dict.items():
                    f.write(f"{uid}:{name}\n")
        
        # 删除人脸数据
        user_face_dir = os.path.join(face_data_dir, f'User.{user_id}')
        if os.path.exists(user_face_dir):
            shutil.rmtree(user_face_dir)
        
        # 删除模型文件
        model_file = os.path.join(trainer_dir, f'{user_id}_train.yml')
        if os.path.exists(model_file):
            os.remove(model_file)
        
        return jsonify({
            "success": True,
            "message": f"用户 {user_id} 已删除"
        })
    
    except Exception as e:
        return jsonify({"success": False, "message": f"删除失败: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)