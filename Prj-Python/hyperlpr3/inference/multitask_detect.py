import numpy as np
import cv2
import copy
from .base.base import HamburgerABC


def xywh2xyxy(boxes):
    """
    将xywh格式的边界框坐标转换为xyxy格式
    Args:
        boxes: xywh格式的边界框坐标
    Returns:
        xyxy格式的边界框坐标
    """
    xywh = copy.deepcopy(boxes)
    xywh[:, 0] = boxes[:, 0] - boxes[:, 2] / 2
    xywh[:, 1] = boxes[:, 1] - boxes[:, 3] / 2
    xywh[:, 2] = boxes[:, 0] + boxes[:, 2] / 2
    xywh[:, 3] = boxes[:, 1] + boxes[:, 3] / 2
    return xywh


def nms(boxes, iou_thresh):
    """
    非极大值抑制（NMS）函数
    Args:
        boxes: 边界框坐标
        iou_thresh: IOU阈值
    Returns:
        保留的边界框索引
    """
    index = np.argsort(boxes[:, 4])[::-1]
    keep = []
    while index.size > 0:
        i = index[0]
        keep.append(i)
        x1 = np.maximum(boxes[i, 0], boxes[index[1:], 0])
        y1 = np.maximum(boxes[i, 1], boxes[index[1:], 1])
        x2 = np.minimum(boxes[i, 2], boxes[index[1:], 2])
        y2 = np.minimum(boxes[i, 3], boxes[index[1:], 3])

        w = np.maximum(0, x2 - x1)
        h = np.maximum(0, y2 - y1)

        inter_area = w * h
        union_area = (boxes[i, 2] - boxes[i, 0]) * (boxes[i, 3] - boxes[i, 1]) + (
                boxes[index[1:], 2] - boxes[index[1:], 0]) * (boxes[index[1:], 3] - boxes[index[1:], 1])
        iou = inter_area / (union_area - inter_area)
        idx = np.where(iou <= iou_thresh)[0]
        index = index[idx + 1]
    return keep


def restore_box(boxes, r, left, top):
    """
    将边界框坐标还原到原始图像尺寸
    Args:
        boxes: 边界框坐标
        r: 缩放比例
        left: 左边界
        top: 上边界
    Returns:
        还原后的边界框坐标
    """
    boxes[:, [0, 2, 5, 7, 9, 11]] -= left
    boxes[:, [1, 3, 6, 8, 10, 12]] -= top

    boxes[:, [0, 2, 5, 7, 9, 11]] /= r
    boxes[:, [1, 3, 6, 8, 10, 12]] /= r
    return boxes


def detect_pre_precessing(img, img_size):
    """
    图像预处理函数
    Args:
        img: 输入图像
        img_size: 目标图像尺寸
    Returns:
        预处理后的图像、缩放比例、左边界、上边界
    """
    img, r, left, top = letter_box(img, img_size)
    img = img[:, :, ::-1].transpose(2, 0, 1).copy().astype(np.float32)
    img = img / 255
    img = img.reshape(1, *img.shape)
    return img, r, left, top


def post_precessing(dets, r, left, top, conf_thresh=0.25, iou_thresh=0.5):
    """
    后处理函数
    Args:
        dets: 检测结果
        r: 缩放比例
        left: 左边界
        top: 上边界
        conf_thresh: 置信度阈值
        iou_thresh: IOU阈值
    Returns:
        后处理后的检测结果
    """
    choice = dets[:, :, 4] > conf_thresh
    dets = dets[choice]
    dets[:, 13:15] *= dets[:, 4:5]
    box = dets[:, :4]
    boxes = xywh2xyxy(box)
    score = np.max(dets[:, 13:15], axis=-1, keepdims=True)
    index = np.argmax(dets[:, 13:15], axis=-1).reshape(-1, 1)
    output = np.concatenate((boxes, score, dets[:, 5:13], index), axis=1)
    reserve_ = nms(output, iou_thresh)
    output = output[reserve_]
    output = restore_box(output, r, left, top)
    return output


def letter_box(img, size=(640, 640)):
    """
    图像缩放函数
    Args:
        img: 输入图像
        size: 目标图像尺寸
    Returns:
        缩放后的图像、缩放比例、左边界、上边界
    """
    h, w, c = img.shape
    r = min(size[0] / h, size[1] / w)
    new_h, new_w = int(h * r), int(w * r)
    top = int((size[0] - new_h) / 2)
    left = int((size[1] - new_w) / 2)

    bottom = size[0] - new_h - top
    right = size[1] - new_w - left
    img_resize = cv2.resize(img, (new_w, new_h))
    img = cv2.copyMakeBorder(img_resize, top, bottom, left, right, borderType=cv2.BORDER_CONSTANT,
                             value=(0, 0, 0))
    return img, r, left, top


class MultiTaskDetectorMNN(HamburgerABC):
    """
    多任务检测器基类
    """

    def __init__(self, mnn_path, box_threshold: float = 0.5, nms_threshold: float = 0.6, *args, **kwargs):
        """
        初始化MNN检测器
        Args:
            mnn_path: MNN模型路径
            box_threshold: 检测框置信度阈值
            nms_threshold: NMS阈值
        """
        from hyperlpr3.common.mnn_adapt import MNNAdapter
        super().__init__(*args, **kwargs)
        assert self.input_size[0] == self.input_size[1]
        self.box_threshold = box_threshold
        self.nms_threshold = nms_threshold
        self.input_shape = (1, 3, self.input_size[0], self.input_size[1])
        if self.input_size[0] == 320:
            self.tensor_shape = [(1, 6300, 15)]
        elif self.input_size[0] == 640:
            self.tensor_shape = [(1, 25200, 15)]
        self.session = MNNAdapter(mnn_path, self.input_shape, outputs_name=['output', ],
                                  outputs_shape=self.tensor_shape)

    def _run_session(self, data):
        """
        执行MNN模型推理
        Args:
            data: 预处理后的输入数据
        Returns:
            模型输出结果
        """
        return self.session.forward(data)

    def _postprocess(self, data):
        """
        后处理函数
        Args:
            data: 检测结果
        Returns:
            后处理后的检测结果
        """
        r, left, top = self.tmp_pack
        return post_precessing(data, r, left, top)

    def _preprocess(self, image):
        """
        图像预处理函数
        Args:
            image: 输入图像
        Returns:
            预处理后的图像
        """
        img, r, left, top = detect_pre_precessing(image, self.input_size)
        self.tmp_pack = r, left, top
        return img


class MultiTaskDetectorDNN(HamburgerABC):
    """
    多任务检测器基类
    """

    def __init__(self, onnx_path, box_threshold: float = 0.5, nms_threshold: float = 0.6, *args, **kwargs):
        """
        初始化OpenCV DNN检测器
        Args:
            onnx_path: ONNX模型路径
            box_threshold: 检测框置信度阈值
            nms_threshold: NMS阈值
        """
        super().__init__(*args, **kwargs)
        self.box_threshold = box_threshold
        self.nms_threshold = nms_threshold
        self.session = cv2.dnn.readNetFromONNX(onnx_path)
        self.input_shape = (1, 3, self.input_size[0], self.input_size[1])
        self.tensor_shape = [(1, 6300, 15)]

    def _run_session(self, data):
        """
        执行OpenCV DNN模型推理
        Args:
            data: 预处理后的输入数据
        Returns:
            模型输出结果
        """
        self.session.setInput(data)
        return [self.session.forward()]

    def _postprocess(self, data):
        """
        后处理函数
        Args:
            data: 检测结果
        Returns:
        """
        r, left, top = self.tmp_pack
        return post_precessing(data, r, left, top)

    def _preprocess(self, image):
        """
        图像预处理函数
        Args:
            image: 输入图像
        Returns:
            预处理后的图像
        """
        img, r, left, top = detect_pre_precessing(image, self.input_size)
        self.tmp_pack = r, left, top
        return img


class MultiTaskDetectorORT(HamburgerABC):
    """
    多任务检测器基类
    """

    def __init__(self, onnx_path, box_threshold: float = 0.5, nms_threshold: float = 0.6, *args, **kwargs):
        """
        初始化ONNX检测器
        Args:
            onnx_path: ONNX模型路径
            box_threshold: 检测框置信度阈值
            nms_threshold: NMS阈值
        """
        super().__init__(*args, **kwargs)
        import onnxruntime as ort
        self.box_threshold = box_threshold
        self.nms_threshold = nms_threshold
        self.session = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
        self.inputs_option = self.session.get_inputs()
        self.outputs_option = self.session.get_outputs()
        input_option = self.inputs_option[0]
        input_size_ = tuple(input_option.shape[2:])
        self.input_size = tuple(self.input_size)
        if not self.input_size:
            self.input_size = input_size_
        assert self.input_size == input_size_, '输入尺寸与模型期望不匹配'
        assert self.input_size[0] == self.input_size[1]
        self.input_name = input_option.name

    def _run_session(self, data):
        """
        执行ONNX模型推理
        Args:
            data: 预处理后的输入数据
        Returns:
            模型输出结果
        """
        return self.session.run([self.outputs_option[0].name], {self.input_name: data})[0]

    def _postprocess(self, data):
        """
        后处理函数
        Args:
            data: 检测结果
        Returns:
        """
        r, left, top = self.tmp_pack
        return post_precessing(data, r, left, top)

    def _preprocess(self, image):
        """
        图像预处理函数
        Args:
            image: 输入图像
        Returns:
            预处理后的图像
        """
        img, r, left, top = detect_pre_precessing(image, self.input_size)
        self.tmp_pack = r, left, top
        return img
