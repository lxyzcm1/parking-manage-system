import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface ParkingLot {
  id: number;
  name: string;
  capacity: number;
  hourly_rate: number;
  description: string;
}

export interface ParkingRecord {
  plate_number: string;
  entry_time: string;
  exit_time?: string;
  duration?: number;
  fee?: number;
  parking_lot: string;
  status: string;
}

export interface ParkingRecordResponse {
  id: number;
  plate_number: string;
  parking_lot_name: string;
  entry_time: string;
  exit_time: string | null;
  duration: number | null;
  fee: number | null;
  status: string;
}

export interface RecordQueryParams {
  start_date?: string;
  end_date?: string;
  plate_number?: string;
  status?: string;
}

export interface StatisticsData {
  total_vehicles: number;
  total_revenue: number;
  average_duration: number;
}

export interface ParkingLotStatistics {
  lot_id: number;
  lot_name: string;
  total_vehicles: number;
  total_revenue: number;
  current_occupancy: number;
  occupancy_rate: number;
}

export interface ParkingStatistics {
  total_vehicles: number;
  total_revenue: number;
  average_duration: number;
  current_occupancy: number;
  lot_statistics: ParkingLotStatistics[];
  hourly_distribution: Record<string, number>;
}

const api = {
  // 获取停车场列表
  async getParkingLots(): Promise<ParkingLot[]> {
    const response = await axios.get<ParkingLot[]>(`${API_BASE_URL}/parking/lots`);
    return response.data;
  },

  // 获取所有停车场
  async getAllParkingLots(): Promise<ParkingLot[]> {
    const response = await axios.get<ParkingLot[]>(`${API_BASE_URL}/parking/lots`);
    return response.data;
  },

  // 更新停车场信息
  async updateParkingLot(id: number, data: Partial<ParkingLot>): Promise<ParkingLot> {
    const response = await axios.put<ParkingLot>(`${API_BASE_URL}/parking/lots/${id}`, data);
    return response.data;
  },

  // 车辆入场
  async vehicleEntry(parkingLotId: number, image: File) {
    const formData = new FormData();
    formData.append('file', image);
    formData.append('parking_lot_id', parkingLotId.toString());

    const response = await axios.post(
      `${API_BASE_URL}/vehicle/entry`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // 车辆出场
  async vehicleExit(image: File) {
    const formData = new FormData();
    formData.append('file', image);

    const response = await axios.post(
      `${API_BASE_URL}/vehicle/exit`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // 获取统计数据
  async getParkingStatistics(startDate: string, endDate: string): Promise<ParkingStatistics> {
    const response = await axios.get<ParkingStatistics>(
      `${API_BASE_URL}/parking/statistics`,
      {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      }
    );
    return response.data;
  },

  // 获取停车记录
  async getParkingRecords(params: RecordQueryParams = {}): Promise<ParkingRecordResponse[]> {
    const response = await axios.get<ParkingRecordResponse[]>(
      `${API_BASE_URL}/parking/records`,
      { params }
    );
    return response.data;
  },
};

export default api;
