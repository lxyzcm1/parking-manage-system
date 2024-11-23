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
}

export interface ParkingRecord {
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

const api = {
  // 获取停车场列表
  async getParkingLots() {
    const response = await axios.get<ParkingLot[]>(`${API_BASE_URL}/parking/lots`);
    return response.data;
  },

  // 车辆入场
  async vehicleEntry(parkingLotId: number, image: File) {
    const formData = new FormData();
    formData.append('parking_lot_id', parkingLotId.toString());
    formData.append('file', image);

    const response = await axios.post<ParkingRecord>(
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

    const response = await axios.post<ParkingRecord>(
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
  async getStatistics(startDate: string, endDate: string) {
    const response = await axios.get<StatisticsData>(
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
  async getParkingRecords(params: RecordQueryParams = {}): Promise<ParkingRecord[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });
  
    const response = await axios.get<ParkingRecord[]>(`${API_BASE_URL}/parking/records?${queryParams.toString()}`);
    return response.data;
  },
};

export default api;
