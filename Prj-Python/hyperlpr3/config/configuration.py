import requests
from tqdm import tqdm
import zipfile
import os
import tempfile
import shutil
from .settings import _DEFAULT_FOLDER_, _MODEL_VERSION_, _ONLINE_URL_, _REMOTE_URL_, onnx_model_maps, onnx_runtime_config


def down_model_file(url, save_path):
    resp = requests.get(url, stream=True)
    total = int(resp.headers.get('content-length', 0))
    with open(save_path, 'wb') as file, tqdm(
            desc="Pull",
            total=total,
            unit='iB',
            unit_scale=True,
            unit_divisor=1024,
    ) as bar:
        for data in resp.iter_content(chunk_size=1024):
            size = file.write(data)
            bar.update(size)


def down_model_zip(url, save_path, is_unzip=False):
    resp = requests.get(url, stream=True)
    total = int(resp.headers.get('content-length', 0))
    name = os.path.join(save_path, os.path.basename(url))
    
    # 如果文件已存在，先尝试删除
    try:
        if os.path.exists(name):
            os.remove(name)
    except (PermissionError, OSError):
        # 如果删除失败，使用一个临时文件名
        temp_dir = tempfile.gettempdir()
        name = os.path.join(temp_dir, f"temp_{os.path.basename(url)}")
    
    with open(name, 'wb') as file, tqdm(
            desc="Pull",
            total=total,
            unit='iB',
            unit_scale=True,
            unit_divisor=1024,
    ) as bar:
        for data in resp.iter_content(chunk_size=1024):
            size = file.write(data)
            bar.update(size)

    if is_unzip:
        try:
            with zipfile.ZipFile(name, "r") as f:
                # 解压到临时目录
                temp_extract_dir = os.path.join(tempfile.gettempdir(), f"temp_extract_{_MODEL_VERSION_}")
                os.makedirs(temp_extract_dir, exist_ok=True)
                f.extractall(temp_extract_dir)
                
                # 确保目标目录存在
                os.makedirs(save_path, exist_ok=True)
                
                # 将文件从临时目录移动到目标目录
                for root, dirs, files in os.walk(temp_extract_dir):
                    for file in files:
                        src_path = os.path.join(root, file)
                        # 计算相对路径
                        rel_path = os.path.relpath(src_path, temp_extract_dir)
                        dst_path = os.path.join(save_path, rel_path)
                        # 确保目标目录存在
                        os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                        # 如果目标文件存在，先删除
                        if os.path.exists(dst_path):
                            try:
                                os.remove(dst_path)
                            except (PermissionError, OSError):
                                continue
                        try:
                            shutil.move(src_path, dst_path)
                        except (PermissionError, OSError):
                            continue
                
                # 清理临时目录
                try:
                    shutil.rmtree(temp_extract_dir)
                except (PermissionError, OSError):
                    pass
        finally:
            # 清理下载的压缩文件
            try:
                os.remove(name)
            except (PermissionError, OSError):
                pass


# def initialization(re_download=False):
#     models_dir = os.path.join(_DEFAULT_FOLDER_, _MODEL_VERSION_, "onnx")
#     os.makedirs(models_dir, exist_ok=True)
#     for model_key in onnx_model_maps:
#         save_path = onnx_runtime_config[model_key]
#         basename = os.path.basename(save_path)
#         remote_url = os.path.join(_REMOTE_URL_, basename + "?raw=true")
#         down_path = os.path.join(models_dir, basename)
#         if not os.path.exists(down_path) or re_download:
#             down_model_file(remote_url, down_path)


def initialization(re_download=False):
    os.makedirs(_DEFAULT_FOLDER_, exist_ok=True)
    models_dir = os.path.join(_DEFAULT_FOLDER_, _MODEL_VERSION_)
    # print(models_dir)
    if not os.path.exists(models_dir) or re_download:
        target_url = os.path.join(_ONLINE_URL_, _MODEL_VERSION_) + '.zip'
        down_model_zip(target_url, _DEFAULT_FOLDER_, True)
