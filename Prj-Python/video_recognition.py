import cv2
import hyperlpr3 as lpr3
import time
from pathlib import Path
from datetime import datetime
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import warnings

# 过滤numpy警告
warnings.filterwarnings('ignore', category=RuntimeWarning, module='numpy')

def cv2_img_add_text(img, text, left, top, text_color=(0, 0, 0), text_size=20):
    """使用PIL绘制中文文本"""
    if isinstance(img, np.ndarray):
        img = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img)
    
    try:
        # 尝试使用系统中文字体
        font_paths = [
            "C:/Windows/Fonts/simhei.ttf",  # Windows 黑体
            "C:/Windows/Fonts/simsun.ttc",  # Windows 宋体
            "C:/Windows/Fonts/msyh.ttc",    # Windows 微软雅黑
        ]
        
        font_path = None
        for path in font_paths:
            if Path(path).exists():
                font_path = path
                break
        
        if font_path:
            fontStyle = ImageFont.truetype(font_path, text_size)
        else:
            # 如果找不到中文字体，使用默认字体
            fontStyle = ImageFont.load_default()
            print("警告：未找到中文字体文件，使用默认字体可能无法正确显示中文")
    except Exception as e:
        print(f"加载字体出错: {e}")
        fontStyle = ImageFont.load_default()
    
    # 获取文本大小
    bbox = draw.textbbox((0, 0), text, font=fontStyle)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # 绘制文本
    draw.text((left, top), text, text_color, font=fontStyle)
    
    return cv2.cvtColor(np.asarray(img), cv2.COLOR_RGB2BGR), text_width, text_height

def draw_plate_on_image(img, result):
    """在图像上绘制车牌检测和识别结果"""
    for plate in result:
        code, confidence, type_idx, box = plate[:4]
        x1, y1, x2, y2 = [int(i) for i in box]
        
        # 绘制车牌框
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # 准备文本
        text = f"{code} ({confidence:.2f})"
        
        # 使用支持中文的方法绘制文本
        img_with_text, text_width, text_height = cv2_img_add_text(img.copy(), text, x1, y1 - 30, (0, 0, 0), 30)
        
        # 绘制文本背景
        cv2.rectangle(img_with_text, (x1, y1 - text_height - 5), (x1 + text_width, y1), (0, 255, 0), -1)
        
        # 再次绘制文本（这次在背景上）
        img_with_text, _, _ = cv2_img_add_text(img_with_text, text, x1, y1 - text_height - 5, (0, 0, 0), 30)
        
        img = img_with_text
    
    return img

def process_video(video_path, output_dir):
    """处理视频文件并进行车牌识别"""
    # 确保输出目录存在
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 生成输出文件名（使用时间戳）
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = output_dir / f"plate_recognition_{timestamp}.mp4"
    
    # 初始化车牌识别器（使用高精度模式）
    catcher = lpr3.LicensePlateCatcher(detect_level=lpr3.DETECT_LEVEL_HIGH)
    
    # 设置置信度阈值
    CONFIDENCE_THRESHOLD = 0.99
    
    # 用于跟踪已打印的车牌号
    printed_plates = set()
    
    # 打开视频文件
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"无法打开视频文件: {video_path}")
    
    # 获取视频属性
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    
    # 配置视频写入器
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
    
    print(f"开始处理视频: {video_path}")
    print(f"输出文件将保存到: {output_path}")
    print(f"\n置信度阈值设置为: {CONFIDENCE_THRESHOLD}")
    print("识别到的车牌号（置信度 > {:.2f}）:".format(CONFIDENCE_THRESHOLD))
    print("-" * 50)
    
    # 处理每一帧
    frame_count = 0
    start_time = time.time()
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            frame_count += 1
            
            # 车牌识别
            results = catcher(frame)
            
            # 处理识别结果
            for plate in results:
                code, confidence, type_idx, box = plate[:4]
                if confidence > CONFIDENCE_THRESHOLD and code not in printed_plates:
                    print(f"车牌号: {code:<10} 置信度: {confidence:.4f}")
                    printed_plates.add(code)
            
            # 在图像上绘制结果
            frame_with_results = draw_plate_on_image(frame, results)
            
            # 计算和显示FPS
            if frame_count % 30 == 0:
                elapsed_time = time.time() - start_time
                fps_text = f"FPS: {frame_count / elapsed_time:.2f}"
                cv2.putText(frame_with_results, fps_text, (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # 显示结果
            cv2.imshow('License Plate Recognition', frame_with_results)
            
            # 写入视频文件
            writer.write(frame_with_results)
            
            # 按'q'退出
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    finally:
        # 释放资源
        cap.release()
        writer.release()
        cv2.destroyAllWindows()
        
    print("-" * 50)
    print(f"处理完成! 共处理 {frame_count} 帧")
    print(f"共识别到 {len(printed_plates)} 个不同车牌")
    print(f"输出文件已保存到: {output_path}")

if __name__ == '__main__':
    # 设置输入输出路径
    video_path = Path("../TestImage/Video007.mp4").absolute()  # 视频文件路径
    output_dir = Path("output").absolute()     # 输出文件夹路径
    
    print(f"视频文件路径: {video_path}")
    print(f"输出目录路径: {output_dir}")
    
    try:
        process_video(str(video_path), str(output_dir))
    except Exception as e:
        print(f"处理视频时出错: {e}")
