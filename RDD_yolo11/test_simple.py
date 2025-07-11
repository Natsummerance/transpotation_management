#!/usr/bin/env python3
"""
简化的YOLO测试脚本
用于测试基本功能，不依赖外部依赖
"""

import json
import os
import sys
import argparse
from pathlib import Path

def mock_predict(source_path, weights_path):
    """
    模拟YOLO预测功能，返回固定的测试结果
    """
    print("=== 模拟YOLO预测 ===")
    print(f"输入图片: {source_path}")
    print(f"模型文件: {weights_path}")
    
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
        import shutil
        shutil.copy2(source_path, predicted_image_path)
        print(f"结果图片已保存到: {predicted_image_path}")
    except Exception as e:
        print(f"复制图片失败: {e}")
        predicted_image_path = source_path
    
    result = {
        "detections": mock_detections,
        "image_path": predicted_image_path,
        "message": "模拟检测完成"
    }
    
    return json.dumps(result, ensure_ascii=False, indent=2)

def test_ultralytics():
    """
    测试ultralytics是否可用
    """
    try:
        from ultralytics import YOLO
        print("✓ ultralytics 可用")
        return True
    except ImportError as e:
        print(f"✗ ultralytics 不可用: {e}")
        return False
    except Exception as e:
        print(f"✗ ultralytics 错误: {e}")
        return False

def real_predict(source_path, weights_path):
    """
    真实的YOLO预测功能
    """
    try:
        from ultralytics import YOLO
        from ultralytics.utils import LOGGER
        
        # 禁用YOLO的详细日志输出
        LOGGER.setLevel('ERROR')
        
        print("=== 真实YOLO预测 ===")
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
                    # 获取类别名称
                    class_id = int(box.cls[0])
                    class_name = r.names[class_id]
                    confidence = float(box.conf[0])
                    
                    detections.append({
                        'name': class_name,
                        'confidence': confidence,
                        'box': [float(coord) for coord in box.xyxy[0]]
                    })

        # 如果没有检测到任何对象，返回空结果
        if not detections:
            return json.dumps({
                'detections': [],
                'image_path': predicted_image_path,
                'message': 'No objects detected'
            })
        else:
            return json.dumps({
                'detections': detections,
                'image_path': predicted_image_path
            })
            
    except Exception as e:
        return json.dumps({"error": f"YOLO预测失败: {str(e)}"})

def main():
    parser = argparse.ArgumentParser(description='YOLO测试脚本')
    parser.add_argument('--source', type=str, required=True, help='输入图片路径')
    parser.add_argument('--weights', type=str, required=True, help='模型权重路径')
    parser.add_argument('--mock', action='store_true', help='使用模拟模式')
    args = parser.parse_args()
    
    print("=== YOLO测试脚本 ===")
    print(f"Python版本: {sys.version}")
    print(f"工作目录: {os.getcwd()}")
    
    # 检查ultralytics是否可用
    ultralytics_available = test_ultralytics()
    
    if args.mock or not ultralytics_available:
        print("使用模拟模式")
        result = mock_predict(args.source, args.weights)
    else:
        print("使用真实YOLO模式")
        result = real_predict(args.source, args.weights)
    
    print(result)

if __name__ == "__main__":
    main() 