import uvicorn
from models.database import init_db

if __name__ == "__main__":
    # 初始化数据库
    init_db()
    
    # 启动FastAPI服务
    uvicorn.run(
        "api.parking_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # 开发模式下启用热重载
    )
