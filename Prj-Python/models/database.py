from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    
    parking_records = relationship("ParkingRecord", back_populates="user")

class ParkingLot(Base):
    __tablename__ = 'parking_lots'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=False)
    hourly_rate = Column(Float, nullable=False)
    description = Column(String(200))
    created_at = Column(DateTime, default=datetime.now)
    
    parking_records = relationship("ParkingRecord", back_populates="parking_lot")

class Vehicle(Base):
    __tablename__ = 'vehicles'
    
    id = Column(Integer, primary_key=True)
    plate_number = Column(String(20), unique=True, nullable=False)
    vehicle_type = Column(String(50))
    created_at = Column(DateTime, default=datetime.now)
    
    parking_records = relationship("ParkingRecord", back_populates="vehicle")

class ParkingRecord(Base):
    __tablename__ = 'parking_records'
    
    id = Column(Integer, primary_key=True)
    vehicle_id = Column(Integer, ForeignKey('vehicles.id'))
    parking_lot_id = Column(Integer, ForeignKey('parking_lots.id'))
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    entry_time = Column(DateTime, nullable=False)
    exit_time = Column(DateTime)
    parking_duration = Column(Float)  # 小时
    fee = Column(Float)
    paid = Column(Boolean, default=False)
    entry_image = Column(String(200))
    exit_image = Column(String(200))
    created_at = Column(DateTime, default=datetime.now)
    
    vehicle = relationship("Vehicle", back_populates="parking_records")
    parking_lot = relationship("ParkingLot", back_populates="parking_records")
    user = relationship("User", back_populates="parking_records")

# 创建数据库引擎
engine = create_engine('sqlite:///parking_system.db')
SessionLocal = sessionmaker(bind=engine)

def get_session():
    return SessionLocal()

def init_db():
    try:
        # 创建所有表
        Base.metadata.create_all(engine)
        
        # 添加默认停车场数据
        session = SessionLocal()
        
        # 检查是否已经有停车场数据
        existing_lots = session.query(ParkingLot).all()
        if not existing_lots:
            default_lots = [
                ParkingLot(
                    name="A区停车场",
                    capacity=100,
                    hourly_rate=10.0,
                    description="位于商场主楼北侧"
                ),
                ParkingLot(
                    name="B区停车场",
                    capacity=150,
                    hourly_rate=8.0,
                    description="位于商场主楼南侧"
                ),
                ParkingLot(
                    name="C区地下停车场",
                    capacity=200,
                    hourly_rate=6.0,
                    description="位于商场地下一层"
                ),
            ]
            
            session.add_all(default_lots)
            session.commit()
        
        session.close()
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise e
