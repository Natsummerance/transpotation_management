import argparse
import json
import os
import sys
import shutil

# 尝试导入ultralytics，如果失败则使用模拟模式
try:
    from ultralytics import YOLO
    from ultralytics.utils import LOGGER
    ULTRALYTICS_AVAILABLE = True
    # 禁用YOLO的详细日志输出
    LOGGER.setLevel('ERROR')
except ImportError:
    ULTRALYTICS_AVAILABLE = False
    print("警告: ultralytics不可用，将使用模拟模式", file=sys.stderr)


def mock_predict(source_path, weights_path):
    """模拟YOLO预测功能"""
    # 检查文件是否存在
    if not os.path.exists(source_path):
        return json.dumps({"error": f"输入文件不存在: {source_path}"})
    
    if not os.path.exists(weights_path):
        return json.dumps({"error": f"模型文件不存在: {weights_path}"})
    
    # 模拟检测结果
    mock_detections = [
        {
            "name": "longitudinal_crack",
            "confidence": 0.85,
            "box": [100, 150, 300, 200]
        },
        {
            "name": "transverse_crack", 
            "confidence": 0.78,
            "box": [200, 100, 400, 120]
        },
        {
            "name": "pothole",
            "confidence": 0.92,
            "box": [150, 250, 250, 300]
        }
    ]
    
    # 构建输出图片路径
    output_dir = 'runs/detect/predict'
    os.makedirs(output_dir, exist_ok=True)
    predicted_image_path = os.path.join(output_dir, os.path.basename(source_path))
    
    # 复制原图作为结果图（模拟）
    try:
        shutil.copy2(source_path, predicted_image_path)
    except Exception as e:
        print(f"复制图片失败: {e}", file=sys.stderr)
        predicted_image_path = source_path
    
    result = {
        "detections": mock_detections,
        "image_path": predicted_image_path,
        "message": "模拟检测完成"
    }
    
    return json.dumps(result, ensure_ascii=False)


def real_predict(source_path, weights_path):
    """真实的YOLO预测功能"""
    if not ULTRALYTICS_AVAILABLE:
        return json.dumps({"error": "ultralytics不可用"})
    
    try:
        model = YOLO(weights_path)
        
        # 设置固定的输出目录
        output_dir = 'runs/detect/predict'
        results = model.predict(source_path, save=True, project='runs/detect', 
                               name='predict', exist_ok=True)

        # 获取预测后的图片路径
        predicted_image_path = os.path.join(output_dir, os.path.basename(source_path))

        # 提取检测结果
        detections = []
        for r in results:
            if r.boxes is not None:
                for box in r.boxes:
                    # 获取类别名称
                    class_id = int(box.cls[0])
                    class_name = r.names[class_id]
                    confidence = float(box.conf[0])
                    
                    detections.append({
                        'name': class_name,
                        'confidence': confidence,
                        'box': [float(coord) for coord in box.xyxy[0]]
                    })

        # 无论是否检测到对象，都返回结果图片路径
        result = {
            'detections': detections,
            'image_path': predicted_image_path,
            'message': f'检测到 {len(detections)} 个对象' if detections else '未检测到对象'
        }
        
        return json.dumps(result, ensure_ascii=False)
            
    except Exception as e:
        return json.dumps({"error": f"YOLO预测失败: {str(e)}"})


def predict(source_path, weights_path, use_mock=False):
    """主预测函数"""
    if use_mock or not ULTRALYTICS_AVAILABLE:
        return mock_predict(source_path, weights_path)
    else:
        return real_predict(source_path, weights_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=str, required=True, help='path to source image')
    parser.add_argument('--weights', type=str, required=True, help='path to model weights')
    parser.add_argument('--mock', action='store_true', help='use mock mode')
    args = parser.parse_args()

    # 重定向stderr到devnull以避免YOLO日志干扰
    original_stderr = sys.stderr
    sys.stderr = open(os.devnull, 'w')
    
    try:
        result = predict(args.source, args.weights, args.mock)
        print(result)
        # 恢复stderr
        sys.stderr.close()
        sys.stderr = original_stderr
    except Exception as e:
        # 恢复stderr
        sys.stderr.close()
        sys.stderr = original_stderr
        # 输出错误信息
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)