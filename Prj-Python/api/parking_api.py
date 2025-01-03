from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import sys
import os
from datetime import datetime, timedelta
import hyperlpr3 as lpr3
import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Dict

# 获取项目根目录的绝对路径
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from models.database import get_session, Vehicle, ParkingRecord, ParkingLot, User

app = FastAPI(
    title="停车场管理系统API",
    description="提供车牌识别、停车管理、费用计算等功能的API接口",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 车牌识别器实例
catcher = lpr3.LicensePlateCatcher(detect_level=lpr3.DETECT_LEVEL_HIGH)


def get_db():
    db = get_session()
    try:
        yield db
    finally:
        db.close()


def save_image(file: UploadFile) -> str:
    """保存上传的图片并返回保存路径"""
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)

    file_path = upload_dir / f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    return str(file_path)


def recognize_plate(image_path: str) -> str:
    """识别图片中的车牌号码"""
    image = cv2.imread(str(image_path))
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image file")

    results = catcher(image)
    if not results:
        raise HTTPException(status_code=400, detail="No license plate detected")

    # 返回置信度最高的车牌号
    return max(results, key=lambda x: x[1])[0]


@app.post("/vehicle/entry", 
    summary="车辆入场",
    description="处理车辆入场，包括上传车辆图片、识别车牌、记录入场时间等",
    response_description="返回入场记录信息",
    responses={
        200: {
            "description": "入场成功",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Vehicle entry recorded successfully",
                        "plate_number": "京A12345",
                        "entry_time": "2023-05-20T10:30:00"
                    }
                }
            }
        },
        400: {
            "description": "请求错误，可能是图片无效或无法识别车牌",
            "content": {
                "application/json": {
                    "example": {"detail": "No license plate detected"}
                }
            }
        }
    }
)
async def vehicle_entry(
        parking_lot_id: int = File(..., description="停车场ID"),
        file: UploadFile = File(..., description="车辆图片"),
        db: Session = Depends(get_db)
):
    """处理车辆入场"""
    # 保存图片
    image_path = save_image(file)

    # 识别车牌
    try:
        plate_number = recognize_plate(image_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 查找或创建车辆记录
    vehicle = db.query(Vehicle).filter(Vehicle.plate_number == plate_number).first()
    if not vehicle:
        vehicle = Vehicle(plate_number=plate_number)
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)

    # 创建停车记录
    parking_record = ParkingRecord(
        vehicle_id=vehicle.id,
        parking_lot_id=parking_lot_id,
        entry_time=datetime.now(),
        entry_image=image_path
    )
    db.add(parking_record)
    db.commit()

    return {
        "message": "Vehicle entry recorded successfully",
        "plate_number": plate_number,
        "entry_time": parking_record.entry_time
    }


@app.post("/vehicle/exit",
    summary="车辆出场",
    description="处理车辆出场，通过上传的图片自动识别车牌，计算停车时长和费用",
    response_description="返回出场记录信息",
    responses={
        200: {
            "description": "出场成功",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Vehicle exit recorded successfully",
                        "plate_number": "京A12345",
                        "duration": 2.5,
                        "fee": 25.0
                    }
                }
            }
        },
        404: {
            "description": "未找到车辆或停车记录",
            "content": {
                "application/json": {
                    "example": {"detail": "Vehicle not found"}
                }
            }
        }
    }
)
async def vehicle_exit(
        file: UploadFile = File(..., description="出场图片"),
        db: Session = Depends(get_db)
):
    """处理车辆出场"""
    # 保存出场图片
    image_path = save_image(file)

    # 识别车牌
    try:
        plate_number = recognize_plate(image_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 查找车辆和未完成的停车记录
    vehicle = db.query(Vehicle).filter(Vehicle.plate_number == plate_number).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle with plate number {plate_number} not found")

    parking_record = (
        db.query(ParkingRecord)
        .filter(
            ParkingRecord.vehicle_id == vehicle.id,
            ParkingRecord.exit_time.is_(None)
        )
        .first()
    )
    if not parking_record:
        raise HTTPException(status_code=404, detail=f"No active parking record found for vehicle {plate_number}")

    # 更新停车记录
    exit_time = datetime.now()
    duration = (exit_time - parking_record.entry_time).total_seconds() / 3600  # 转换为小时

    # 获取停车场费率
    parking_lot = db.query(ParkingLot).filter(ParkingLot.id == parking_record.parking_lot_id).first()
    fee = duration * parking_lot.hourly_rate

    parking_record.exit_time = exit_time
    parking_record.parking_duration = duration
    parking_record.fee = fee
    parking_record.exit_image = image_path

    db.commit()

    return {
        "message": "Vehicle exit recorded successfully",
        "plate_number": plate_number,
        "duration": duration,
        "fee": fee,
        "parking_lot": parking_lot.name
    }


@app.get("/parking/statistics",
    summary="获取停车统计数据",
    description="根据指定的时间范围获取停车场统计数据，包括车辆数量、收入等",
    response_description="返回统计数据",
    responses={
        200: {
            "description": "获取成功",
            "content": {
                "application/json": {
                    "example": {
                        "total_vehicles": 100,
                        "total_revenue": 1500.0,
                        "average_duration": 2.5,
                        "current_occupancy": 50,
                        "lot_statistics": [
                            {
                                "lot_id": 1,
                                "lot_name": "A区停车场",
                                "total_vehicles": 50,
                                "total_revenue": 750.0,
                                "current_occupancy": 25,
                                "occupancy_rate": 0.5
                            }
                        ],
                        "hourly_distribution": {
                            "00": 10,
                            "01": 5,
                            "02": 3
                        }
                    }
                }
            }
        }
    }
)
async def get_statistics(
        start_date: str = Query(..., description="开始日期，格式：YYYY-MM-DD"),
        end_date: str = Query(..., description="结束日期，格式：YYYY-MM-DD"),
        db: Session = Depends(get_db)
):
    """获取停车统计数据"""
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)

    # 获取所有停车场
    parking_lots = db.query(ParkingLot).all()
    
    # 初始化统计数据
    total_stats = {
        "total_vehicles": 0,
        "total_revenue": 0.0,
        "total_duration": 0.0,
        "current_occupancy": 0
    }
    
    # 初始化每个停车场的统计数据
    lot_statistics = []
    
    # 初始化24小时分布数据
    hourly_distribution = {f"{i:02d}": 0 for i in range(24)}
    
    for lot in parking_lots:
        # 查询该停车场在指定时间范围内的记录
        records = (
            db.query(ParkingRecord)
            .filter(
                ParkingRecord.parking_lot_id == lot.id,
                ParkingRecord.entry_time >= start,
                ParkingRecord.entry_time < end
            )
            .all()
        )
        
        # 计算该停车场的统计数据
        lot_total_vehicles = len(records)
        lot_total_revenue = sum(record.fee or 0 for record in records)
        
        # 计算当前在场车辆
        current_vehicles = (
            db.query(ParkingRecord)
            .filter(
                ParkingRecord.parking_lot_id == lot.id,
                ParkingRecord.entry_time <= datetime.now(),
                ParkingRecord.exit_time == None
            )
            .count()
        )
        
        # 更新总统计数据
        total_stats["total_vehicles"] += lot_total_vehicles
        total_stats["total_revenue"] += lot_total_revenue
        total_stats["current_occupancy"] += current_vehicles
        
        # 计算该停车场的占用率
        occupancy_rate = current_vehicles / lot.capacity if lot.capacity > 0 else 0
        
        # 添加停车场统计数据
        lot_statistics.append({
            "lot_id": lot.id,
            "lot_name": lot.name,
            "total_vehicles": lot_total_vehicles,
            "total_revenue": lot_total_revenue,
            "current_occupancy": current_vehicles,
            "occupancy_rate": occupancy_rate
        })
        
        # 统计24小时分布
        for record in records:
            hour = record.entry_time.strftime("%H")
            hourly_distribution[hour] = hourly_distribution.get(hour, 0) + 1
    
    # 计算平均停车时长
    total_duration = sum(
        (record.exit_time - record.entry_time).total_seconds() / 3600
        for record in db.query(ParkingRecord)
        .filter(
            ParkingRecord.entry_time >= start,
            ParkingRecord.entry_time < end,
            ParkingRecord.exit_time != None
        )
        .all()
    )
    average_duration = total_duration / total_stats["total_vehicles"] if total_stats["total_vehicles"] > 0 else 0
    
    return {
        "total_vehicles": total_stats["total_vehicles"],
        "total_revenue": total_stats["total_revenue"],
        "average_duration": average_duration,
        "current_occupancy": total_stats["current_occupancy"],
        "lot_statistics": lot_statistics,
        "hourly_distribution": hourly_distribution
    }


@app.get("/parking/lots",
    summary="获取停车场列表",
    description="获取所有可用的停车场信息",
    response_description="返回停车场列表",
    responses={
        200: {
            "description": "成功获取停车场列表",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "id": 1,
                            "name": "A区停车场",
                            "capacity": 100,
                            "hourly_rate": 10.0,
                            "description": "位于商场主楼北侧"
                        }
                    ]
                }
            }
        }
    }
)
async def get_parking_lots(db: Session = Depends(get_db)):
    """获取所有停车场信息"""
    parking_lots = db.query(ParkingLot).all()
    return parking_lots


@app.put("/parking/lots/{lot_id}",
    summary="更新停车场信息",
    description="更新指定停车场的信息，包括名称、容量、费率等",
    response_description="返回更新后的停车场信息",
    responses={
        200: {
            "description": "成功更新停车场信息",
            "content": {
                "application/json": {
                    "example": {
                        "id": 1,
                        "name": "A区停车场",
                        "capacity": 100,
                        "hourly_rate": 10.0,
                        "description": "位于商场主楼北侧"
                    }
                }
            }
        },
        404: {"description": "停车场不存在"}
    }
)
async def update_parking_lot(
    lot_id: int,
    lot_data: Dict = Body(..., example={
        "name": "A区停车场",
        "capacity": 100,
        "hourly_rate": 10.0,
        "description": "位于商场主楼北侧"
    }),
    db: Session = Depends(get_db)
):
    """更新停车场信息"""
    lot = db.query(ParkingLot).filter(ParkingLot.id == lot_id).first()
    if not lot:
        raise HTTPException(status_code=404, detail="停车场不存在")
    
    for key, value in lot_data.items():
        if hasattr(lot, key):
            setattr(lot, key, value)
    
    try:
        db.commit()
        return lot
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/parking/records",
    summary="获取停车记录",
    description="获取所有或指定条件的停车记录",
    response_description="返回停车记录列表",
    responses={
        200: {
            "description": "成功获取停车记录",
            "content": {
                "application/json": {
                    "example": [{
                        "id": 1,
                        "plate_number": "京A12345",
                        "parking_lot_name": "A区停车场",
                        "entry_time": "2023-05-20T10:30:00",
                        "exit_time": "2023-05-20T12:30:00",
                        "duration": 2.0,
                        "fee": 20.0,
                        "status": "已完成"
                    }]
                }
            }
        }
    }
)
async def get_parking_records(
    start_date: str = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: str = Query(None, description="结束日期 YYYY-MM-DD"),
    plate_number: str = Query(None, description="车牌号"),
    status: str = Query(None, description="状态：在场/已离场"),
    db: Session = Depends(get_db)
):
    """获取停车记录"""
    query = (
        db.query(
            ParkingRecord,
            Vehicle.plate_number,
            ParkingLot.name.label('parking_lot_name')
        )
        .join(Vehicle)
        .join(ParkingLot)
    )

    if start_date:
        query = query.filter(ParkingRecord.entry_time >= datetime.strptime(start_date, "%Y-%m-%d"))
    if end_date:
        query = query.filter(ParkingRecord.entry_time <= datetime.strptime(end_date, "%Y-%m-%d"))
    if plate_number:
        query = query.filter(Vehicle.plate_number.like(f"%{plate_number}%"))
    if status:
        if status == "在场":
            query = query.filter(ParkingRecord.exit_time.is_(None))
        elif status == "已离场":
            query = query.filter(ParkingRecord.exit_time.isnot(None))

    records = query.order_by(ParkingRecord.entry_time.desc()).all()

    return [{
        "id": record.ParkingRecord.id,
        "plate_number": record.plate_number,
        "parking_lot_name": record.parking_lot_name,
        "entry_time": record.ParkingRecord.entry_time,
        "exit_time": record.ParkingRecord.exit_time,
        "duration": record.ParkingRecord.parking_duration,
        "fee": record.ParkingRecord.fee,
        "status": "已离场" if record.ParkingRecord.exit_time else "在场"
    } for record in records]
