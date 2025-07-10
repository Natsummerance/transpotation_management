import argparse
import json
import os
import sys
from ultralytics import YOLO
from ultralytics.utils import LOGGER

# 禁用YOLO的详细日志输出
LOGGER.setLevel('ERROR')

def predict(source_path, weights_path):
    model = YOLO(weights_path)
    
    # 设置固定的输出目录
    output_dir = 'runs/detect/predict'
    results = model.predict(source_path, save=True, project='runs/detect', name='predict', exist_ok=True)

    # 获取预测后的图片路径
    predicted_image_path = os.path.join(output_dir, os.path.basename(source_path))

    # 提取检测结果
    detections = []
    for r in results:
        if r.boxes is not None:
            for box in r.boxes:
                detections.append({
                    'name': r.names[int(box.cls)],
                    'confidence': float(box.conf),
                    'box': [float(coord) for coord in box.xyxy[0]]
                })

    return {
        'detections': detections,
        'image_path': predicted_image_path
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=str, required=True, help='path to source image')
    parser.add_argument('--weights', type=str, required=True, help='path to model weights')
    args = parser.parse_args()

    # 重定向stderr到devnull以避免YOLO日志干扰
    original_stderr = sys.stderr
    sys.stderr = open(os.devnull, 'w')
    
    try:
        result = predict(args.source, args.weights)
        # 恢复stderr
        sys.stderr.close()
        sys.stderr = original_stderr
        # 只输出JSON结果
        print(json.dumps(result))
    except Exception as e:
        # 恢复stderr
        sys.stderr.close()
        sys.stderr = original_stderr
        # 输出错误信息
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)