# HyperLPR3 - 中文车牌识别系统
（ 原项目链接：https://github.com/szad670401/HyperLPR ）

HyperLPR3 是一个专门为中国车牌设计的高级车牌识别系统。该项目利用深度学习模型和计算机视觉技术实现准确的车牌检测和识别。

## 项目结构

```
hyperlpr3/
├── __init__.py           # 包初始化文件
├── hyperlpr3.py         # 主入口和核心功能
├── command/             # 命令行接口工具
├── common/              # 通用工具和类型定义
├── config/             # 配置设置和初始化
└── inference/          # 核心推理模块
```

## 主要组件

### 1. 核心模块

- **LicensePlateCatcher**: 车牌识别主类
  - 支持不同的推理后端（目前支持ONNX Runtime）
  - 可配置的检测级别（低/高分辨率）
  - 可自定义的日志和输出格式

### 2. 流水线组件

- **检测模块**: 多任务检测器，用于定位图像中的车牌
- **识别模块**: 基于PPCNN的识别器，用于读取车牌字符
- **分类模块**: 用于确定车牌类型的分类器
- **流水线**: 协调整个识别过程

### 3. 功能特点

- 多任务检测提高准确率
- 支持双层车牌
- 可配置的推理设置
- 全面的车牌信息输出
- ONNX Runtime优化以提升性能

## 技术细节

系统使用三阶段流水线架构：
1. **检测**: 在输入图像中定位车牌
2. **处理**: 处理图像预处理和转换
3. **识别**: 对检测到的车牌进行字符识别

项目支持不同的检测级别：
- 低分辨率 (320x320) 用于更快的处理速度
- 高分辨率 (640x640) 用于更好的准确率

## 依赖项

- ONNX Runtime
- NumPy
- OpenCV (用于图像处理)

## 使用方法

系统的初始化和使用方法如下：

```python
from hyperlpr3 import LicensePlateCatcher

# 初始化识别系统
catcher = LicensePlateCatcher()

# 处理图像
results = catcher(image)
```

更详细的使用说明和示例，请参考文档。

## Inference 推理模块详细说明

### 目录结构

```
inference/
├── __init__.py          # 模块初始化文件
├── base/                # 基础类定义
│   ├── __init__.py     # 基础模块初始化
│   └── base.py         # 基础抽象类
├── pipeline.py         # 主处理流水线实现
├── multitask_detect.py # 多任务检测器实现
├── recognition.py      # 字符识别实现
├── classification.py   # 车牌类型分类实现
├── detect.py          # 基础检测器实现
└── vertex.py          # 顶点检测实现
```

### 核心文件说明

#### 1. pipeline.py - 主处理流水线

主要实现了两种处理流水线：
- **LPRMultiTaskPipeline**: 多任务并行处理流水线
  - 功能：
    * 集成检测、识别和分类三个任务
    * 支持单张和批量图片处理
    * 自动任务调度和结果整合
  - 核心方法：
    * `run(image)`: 执行完整的车牌识别流程
    * `__call__(image)`: 便捷调用接口
  - 处理流程：
    1. 图像预处理和尺寸调整
    2. 车牌区域检测和定位
    3. 字符识别和分类
    4. 结果后处理和格式化

#### 2. multitask_detect.py - 多任务检测器

实现了三种不同后端的检测器：
- **MultiTaskDetectorORT**: ONNX Runtime后端
- **MultiTaskDetectorMNN**: MNN移动端后端
- **MultiTaskDetectorDNN**: OpenCV DNN后端

核心功能：
- 图像预处理：
  * 自适应尺寸调整
  * 边界框坐标转换
  * 图像归一化
- 检测优化：
  * 非极大值抑制(NMS)
  * 置信度过滤
  * 边界框还原
- 支持特性：
  * 可配置的输入尺寸(320x320/640x640)
  * 可调节的检测阈值
  * 支持批量处理

#### 3. recognition.py - 字符识别器

实现了基于PPCNN的车牌字符识别：
- **PPRCNNRecognition**: 主要识别类
  - 特点：
    * 支持变长字符序列
    * 自适应宽高比处理
    * 集成CTC解码
  - 核心功能：
    * 字符图像预处理
    * 特征提取和编码
    * 字符序列解码
  - 优化技术：
    * 图像增强
    * 尺寸自适应
    * 置信度评估
  - 支持的字符：
    * 中文省份简称
    * 英文字母
    * 阿拉伯数字
    * 特殊字符（如警、使、领等）

#### 4. classification.py - 车牌类型分类器

实现了基于深度学习的车牌类型分类：
- **ClassificationORT**: ONNX Runtime分类器
  - 功能：
    * 车牌类型识别
    * 颜色分类
    * 使用类型判断
  - 技术特点：
    * 图像归一化处理
    * 多类别分类
    * 高效推理优化
  - 支持类型：
    * 蓝牌、黄牌
    * 新能源车牌
    * 警车牌
    * 使馆车牌
    * 军用车牌
  - 核心方法：
    * `_preprocess`: 图像预处理和编码
    * `_run_session`: 模型推理
    * `_postprocess`: 结果后处理

#### 5. detect.py - 基础检测器

实现了基于YOLOv5的车牌检测：
- **Y5rkDetector**: 基础检测器类
  - 实现版本：
    * Y5rkDetectorMNN: MNN后端
    * Y5rkDetectorORT: ONNX Runtime后端
  - 核心功能：
    * 多尺度检测
    * Anchor-based预测
    * NMS后处理
  - 技术特点：
    * 预定义Anchor映射
    * 自适应图像变换
    * 多层特征融合
  - 优化设计：
    * 支持320x320和640x640输入
    * 可配置的检测和NMS阈值
    * 高效的张量处理

#### 6. vertex.py - 顶点检测器

实现了车牌四角顶点的精确定位：
- **BVTVertex**: 顶点检测基类
  - 实现版本：
    * BVTVertexMNN: MNN后端实现
    * BVTVertexORT: ONNX Runtime后端实现
  - 主要功能：
    * 车牌四角点定位
    * 坐标归一化处理
    * 形状校正支持
  - 技术特点：
    * 亚像素级别定位
    * 支持透视变换
    * 自适应尺寸处理
  - 应用场景：
    * 车牌倾斜校正
    * 透视变换预处理
    * 精确ROI提取

### 配置和使用示例

```python
from hyperlpr3 import LicensePlateCatcher
import cv2
import numpy as np

def process_image(image_path):
    # 1. 初始化各个组件
    detector = Y5rkDetectorORT(
        onnx_path='models/detect.onnx',
        box_threshold=0.5,
        nms_threshold=0.6
    )
    
    vertex_detector = BVTVertexORT(
        onnx_path='models/vertex.onnx',
        input_size=(96, 96)
    )
    
    classifier = ClassificationORT(
        onnx_path='models/classify.onnx',
        input_size=(96, 96)
    )
    
    recognizer = PPRCNNRecognitionORT(
        onnx_path='models/recognition.onnx',
        input_size=(48, 160)
    )

    # 2. 读取并预处理图像
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("无法读取图像文件")
    
    # 3. 车牌检测
    boxes = detector(image)
    results = []
    
    for box in boxes:
        # 4. 提取车牌区域
        plate_img = crop_plate(image, box)
        
        # 5. 顶点检测和校正
        vertices = vertex_detector(plate_img)
        plate_aligned = perspective_transform(plate_img, vertices)
        
        # 6. 车牌类型分类
        plate_type = classifier(plate_aligned)
        
        # 7. 字符识别
        chars = recognizer(plate_aligned)
        
        # 8. 结果整合
        result = {
            'plate_number': ''.join(chars),
            'confidence': float(box[4]),
            'plate_type': plate_type,
            'box': box[:4].tolist(),
            'vertices': vertices.tolist()
        }
        results.append(result)
    
    return results

def main():
    # 使用示例
    image_path = "test.jpg"
    try:
        results = process_image(image_path)
        
        # 结果输出
        for idx, result in enumerate(results, 1):
            print(f"\n车牌 {idx}:")
            print(f"号码: {result['plate_number']}")
            print(f"置信度: {result['confidence']:.2f}")
            print(f"类型: {result['plate_type']}")
            print(f"位置: {result['box']}")
    
    except Exception as e:
        print(f"处理出错: {str(e)}")

if __name__ == "__main__":
    main()
```

### 处理流程说明

1. **初始化阶段**
   - 加载各个模型
   - 配置相关参数
   - 初始化处理组件

2. **图像预处理**
   - 读取输入图像
   - 格式转换和检查
   - 尺寸调整（如需要）

3. **车牌检测**
   - 使用YOLOv5检测器
   - 获取车牌区域坐标
   - 应用NMS过滤

4. **区域提取**
   - 根据检测框裁剪
   - 保持适当边界margin
   - 处理边界情况

5. **顶点检测和校正**
   - 精确定位四个顶点
   - 透视变换校正
   - 统一尺寸处理

6. **类型分类**
   - 确定车牌类型
   - 颜色识别
   - 特殊车牌判断

7. **字符识别**
   - 序列字符识别
   - 置信度计算
   - 后处理优化

8. **结果整合**
   - 组织识别信息
   - 格式化输出
   - 提供完整结果

## Common模块文档

#### 项目结构

```
common/
├── __init__.py          # 模块初始化文件
├── mnn_adapt.py         # MNN后端适配器
├── tokenize.py          # 字符分词处理
├── tools_process.py     # 图像处理工具集
└── typedef.py           # 类型定义文件
```

#### 1. tools_process.py - 图像处理工具集

核心功能类和方法：

```python
class ImageProcessor:
    """图像处理工具类"""
    
    @staticmethod
    def resize_keep_ratio(image, target_size):
        """保持宽高比的图像缩放
        Args:
            image: 输入图像
            target_size: 目标尺寸 (width, height)
        Returns:
            缩放后的图像
        """
        
    @staticmethod
    def crop_plate(image, box, margin=0.1):
        """裁剪车牌区域
        Args:
            image: 原始图像
            box: 检测框坐标 [x1,y1,x2,y2]
            margin: 边界扩展比例
        Returns:
            车牌区域图像
        """
        
    @staticmethod
    def perspective_transform(image, vertices):
        """透视变换校正
        Args:
            image: 输入图像
            vertices: 四个顶点坐标
        Returns:
            校正后的图像
        """
```

主要功能：
- 图像预处理
  * 尺寸调整
  * 色彩空间转换
  * 归一化处理
- 几何变换
  * 透视校正
  * 仿射变换
  * 旋转校正
- 区域处理
  * ROI提取
  * 边界扩展
  * 裁剪优化

#### 2. typedef.py - 类型定义

关键类型定义：

```python
class PlateInfo:
    """车牌信息数据类"""
    def __init__(self):
        self.plate_type = None     # 车牌类型
        self.plate_color = None    # 车牌颜色
        self.plate_number = None   # 车牌号码
        self.confidence = 0.0      # 置信度
        self.vertices = None       # 顶点坐标
        self.box = None           # 检测框
        
class DetectBox:
    """检测框类型"""
    def __init__(self, x1, y1, x2, y2, score):
        self.x1 = x1              # 左上角x
        self.y1 = y1              # 左上角y
        self.x2 = x2              # 右下角x
        self.y2 = y2              # 右下角y
        self.score = score        # 检测分数
```

主要类型：
- 数据结构
  * 车牌信息类
  * 检测框类型
  * 顶点坐标类
- 枚举定义
  * 车牌类型
  * 车牌颜色
  * 处理状态

#### 3. mnn_adapt.py - MNN后端适配器

适配器接口：

```python
class MNNAdapter:
    """MNN推理后端适配器"""
    
    def __init__(self, model_path):
        """初始化MNN推理器
        Args:
            model_path: MNN模型路径
        """
        
    def preprocess(self, image):
        """输入预处理
        Args:
            image: 输入图像
        Returns:
            处理后的张量
        """
        
    def inference(self, input_tensor):
        """模型推理
        Args:
            input_tensor: 输入张量
        Returns:
            输出张量
        """
```

主要功能：
- 模型加载和初始化
- 数据预处理和后处理
- 推理接口适配
- 性能优化

#### 4. tokenize.py - 字符分词处理

核心功能：

```python
class PlateTokenizer:
    """车牌字符分词器"""
    
    def __init__(self):
        self.vocab = self._load_vocab()
        
    def encode(self, text):
        """编码车牌文本
        Args:
            text: 车牌号码字符串
        Returns:
            编码后的token序列
        """
        
    def decode(self, tokens):
        """解码token序列
        Args:
            tokens: token序列
        Returns:
            车牌号码字符串
        """
```

主要功能：
- 字符编码和解码
- 词表管理
- 特殊字符处理
- CTC解码优化

### 使用示例

```python
# 图像处理示例
processor = ImageProcessor()
resized = processor.resize_keep_ratio(image, (640, 640))
plate_roi = processor.crop_plate(image, box, margin=0.1)
aligned = processor.perspective_transform(plate_roi, vertices)

# 类型使用示例
plate = PlateInfo()
plate.plate_number = "京A12345"
plate.confidence = 0.95
plate.plate_type = "blue"

# MNN推理示例
adapter = MNNAdapter("model.mnn")
tensor = adapter.preprocess(image)
output = adapter.inference(tensor)

# 分词示例
tokenizer = PlateTokenizer()
tokens = tokenizer.encode("京A12345")
text = tokenizer.decode(tokens)

```

## Config模块文档

#### 项目结构

```
config/
├── __init__.py          # 模块初始化文件
├── configuration.py     # 配置管理和模型下载
└── settings.py          # 全局设置和常量
```

#### 1. settings.py - 全局设置

全局常量定义：

```python
# 模型版本号
_MODEL_VERSION_ = "20230229"

# 模型存储路径
# Windows: %HOMEPATH%/.hyperlpr3
# Linux/Mac: $HOME/.hyperlpr3
_DEFAULT_FOLDER_ = os.path.join(os.environ['HOME'], ".hyperlpr3")

# 在线模型下载地址
_ONLINE_URL_ = "http://hyperlpr.tunm.top/raw/"

# ONNX运行时配置
onnx_runtime_config = {
    # 检测模型 (320x320)
    "det_model_path_320x": "20230229/onnx/y5fu_320x_sim.onnx",
    # 检测模型 (640x640)
    "det_model_path_640x": "20230229/onnx/y5fu_640x_sim.onnx",
    # 识别模型
    "rec_model_path": "20230229/onnx/rpv3_mdict_160_r3.onnx",
    # 分类模型
    "cls_model_path": "20230229/onnx/litemodel_cls_96x_r1.onnx"
}
```

主要配置：
- 版本控制
  * 模型版本管理
  * 兼容性检查
- 路径配置
  * 模型存储位置
  * 跨平台支持
- 模型配置
  * ONNX模型映射
  * 运行时设置

#### 2. configuration.py - 配置管理

核心功能：

```python
def initialization(re_download=False):
    """初始化配置和下载模型
    Args:
        re_download: 是否重新下载模型
    """
    # 创建模型目录
    os.makedirs(_DEFAULT_FOLDER_, exist_ok=True)
    models_dir = os.path.join(_DEFAULT_FOLDER_, _MODEL_VERSION_)
    
    # 下载并解压模型
    if not os.path.exists(models_dir) or re_download:
        target_url = os.path.join(_ONLINE_URL_, _MODEL_VERSION_) + '.zip'
        down_model_zip(target_url, _DEFAULT_FOLDER_, True)

def down_model_zip(url, save_path, is_unzip=False):
    """下载模型压缩包
    Args:
        url: 下载地址
        save_path: 保存路径
        is_unzip: 是否解压
    """
    # 下载进度显示
    resp = requests.get(url, stream=True)
    total = int(resp.headers.get('content-length', 0))
    
    # 写入文件
    with open(save_path, 'wb') as file, tqdm(...) as bar:
        for data in resp.iter_content(chunk_size=1024):
            size = file.write(data)
            bar.update(size)
            
    # 解压文件
    if is_unzip:
        with zipfile.ZipFile(save_path, "r") as f:
            f.extractall(save_path)
```

主要功能：
- 模型管理
  * 自动下载
  * 版本检查
  * 完整性验证
- 文件操作
  * 压缩包处理
  * 目录管理
  * 权限控制
- 进度显示
  * 下载进度条
  * 状态反馈
  * 错误处理

### 使用示例

```python
from hyperlpr3.config import initialization
from hyperlpr3.config.settings import onnx_runtime_config

# 初始化配置（首次运行）
initialization()

# 重新下载模型
initialization(re_download=True)

# 获取模型路径
det_model = onnx_runtime_config["det_model_path_640x"]
rec_model = onnx_runtime_config["rec_model_path"]
cls_model = onnx_runtime_config["cls_model_path"]

# 使用配置
detector = Y5rkDetectorORT(
    onnx_path=os.path.join(_DEFAULT_FOLDER_, det_model)
)

recognizer = PPRCNNRecognitionORT(
    onnx_path=os.path.join(_DEFAULT_FOLDER_, rec_model)
)
```

### 配置说明

1. **模型版本**
   - 版本号格式：YYYYMMDD
   - 当前版本：20230229
   - 自动版本检查和更新

2. **存储路径**
   - Windows: `%HOMEPATH%/.hyperlpr3`
   - Linux/Mac: `$HOME/.hyperlpr3`
   - 自动创建所需目录

3. **模型文件**
   - 检测模型：
     * 320x320版本：轻量级，适合实时处理
     * 640x640版本：高精度，适合离线处理
   - 识别模型：支持中文字符
   - 分类模型：车牌类型分类

4. **在线更新**
   - 自动检查新版本
   - 增量更新支持
   - 断点续传

## HyperLPR3主模块文档

### 核心类：LicensePlateCatcher

```python
class LicensePlateCatcher:
    """车牌识别主类
    
    提供了一个统一的接口来完成车牌检测、分类和识别的完整流程。
    支持多种推理后端，可配置的检测精度级别，以及完整的日志系统。
    
    Args:
        inference: 推理后端类型
            INFER_ONNX_RUNTIME: ONNX Runtime后端
            INFER_OPENCV: OpenCV DNN后端
            INFER_MNN: MNN后端
        folder: 模型文件存储路径
        detect_level: 检测精度级别
            DETECT_LEVEL_LOW: 使用320x320输入（更快）
            DETECT_LEVEL_HIGH: 使用640x640输入（更准）
        logger_level: 日志级别 (0-5)
        full_result: 是否返回完整结果（包含置信度等信息）
    """
    
    def __init__(self,
                 inference: int = INFER_ONNX_RUNTIME,
                 folder: str = _DEFAULT_FOLDER_,
                 detect_level: int = DETECT_LEVEL_LOW,
                 logger_level: int = 3,
                 full_result: bool = False):
        pass
        
    def __call__(self, image: np.ndarray) -> List[PlateInfo]:
        """执行车牌识别
        
        Args:
            image: 输入图像 (BGR格式的numpy数组)
            
        Returns:
            如果full_result=False:
                返回识别到的车牌号码列表
            如果full_result=True:
                返回PlateInfo对象列表，包含：
                - plate_number: 车牌号码
                - confidence: 置信度
                - plate_type: 车牌类型
                - box: 检测框坐标 [x1,y1,x2,y2]
                - vertices: 四个顶点坐标
        """
        pass
```

### 常量定义

```python
# 推理后端类型
INFER_ONNX_RUNTIME = 0    # ONNX Runtime (默认)
INFER_OPENCV = 1          # OpenCV DNN
INFER_MNN = 2            # MNN (移动端)

# 检测精度级别
DETECT_LEVEL_LOW = 0      # 320x320 输入
DETECT_LEVEL_HIGH = 1     # 640x640 输入

# 日志级别
LOGGER_VERBOSE = 0        # 详细日志
LOGGER_INFO = 2          # 信息日志
LOGGER_WARNING = 3       # 警告日志（默认）
LOGGER_ERROR = 4         # 错误日志
LOGGER_FATAL = 5         # 致命错误
```

### 使用示例

1. **基本使用**
```python
import cv2
from hyperlpr3 import LicensePlateCatcher

# 创建识别器（使用默认配置）
catcher = LicensePlateCatcher()

# 读取图像
image = cv2.imread("car.jpg")

# 识别车牌
plates = catcher(image)

# 输出结果
for plate in plates:
    print(f"车牌号码: {plate}")
```

2. **高精度模式**
```python
# 使用640x640检测模型
catcher = LicensePlateCatcher(
    detect_level=DETECT_LEVEL_HIGH,
    full_result=True
)

# 获取完整结果
results = catcher(image)

for result in results:
    print(f"号码: {result.plate_number}")
    print(f"类型: {result.plate_type}")
    print(f"置信度: {result.confidence:.2f}")
    print(f"位置: {result.box}")
```

3. **自定义配置**
```python
# 使用OpenCV后端，详细日志
catcher = LicensePlateCatcher(
    inference=INFER_OPENCV,
    logger_level=LOGGER_VERBOSE,
    folder="models"  # 自定义模型路径
)
```

