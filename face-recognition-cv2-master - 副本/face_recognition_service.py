from flask import Flask, request, jsonify
import cv2
import numpy as np
import os
import base64
import threading

app = Flask(__name__)

# 初始化代码 (从你的代码中提取)
id_dict = {}
face_cascade = cv2.CascadeClassifier("haarcascade_frontalface_default.xml")
recognizer = cv2.face.LBPHFaceRecognizer_create()
system_state_lock = threading.Lock()

def init_config():
    # 你的初始化代码
    pass

init_config()

@app.route('/recognize', methods=['POST'])
def recognize_face():
    try:
        data = request.json
        image_data = base64.b64decode(data['image'].split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if not system_state_lock.acquire(blocking=False):
            return jsonify({"success": False, "message": "服务忙"})
        
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)
            
            if len(faces) == 0:
                return jsonify({"success": False, "message": "未检测到人脸"})
            
            # 识别最清晰的人脸
            x, y, w, h = max(faces, key=lambda f: f[2]*f[3])
            face_roi = gray[y:y+h, x:x+w]
            
            # 加载训练模型
            trainer_dir = 'traindata'
            models = {}
            for file in os.listdir(trainer_dir):
                if file.endswith("_train.yml"):
                    user_id = int(file.split('_')[0])
                    model = cv2.face.LBPHFaceRecognizer_create()
                    model.read(os.path.join(trainer_dir, file))
                    models[user_id] = model
            
            # 预测结果
            best_match_id = -1
            best_confidence = float('inf')
            
            for user_id, model in models.items():
                id_num, confidence = model.predict(face_roi)
                if confidence < best_confidence:
                    best_confidence = confidence
                    best_match_id = user_id
            
            if best_confidence > 70:
                return jsonify({"success": False, "message": "识别置信度过低"})
            
            username = id_dict.get(best_match_id, f"用户{best_match_id}")
            return jsonify({
                "success": True,
                "userId": best_match_id,
                "username": username
            })
        finally:
            system_state_lock.release()
    except Exception as e:
        return jsonify({"success": False, "message": f"识别失败: {str(e)}"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, threaded=True)