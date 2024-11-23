import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Progress,
  Space,
  Empty,
  message,
} from 'antd';
import {
  CarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api, { ParkingLotStatistics, ParkingStatistics } from '../services/api';

const { RangePicker } = DatePicker;

const defaultStats: ParkingStatistics = {
  total_vehicles: 0,
  total_revenue: 0,
  average_duration: 0,
  current_occupancy: 0,
  lot_statistics: [],
  hourly_distribution: {},
};

const Statistics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<ParkingStatistics>(defaultStats);
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await api.getParkingStatistics(dateRange[0], dateRange[1]);
      console.log('Statistics data:', data); // 添加日志
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange([
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD'),
      ]);
    }
  };

  const columns: ColumnsType<ParkingLotStatistics> = [
    {
      title: '停车场',
      dataIndex: 'lot_name',
      key: 'lot_name',
    },
    {
      title: '总车流量',
      dataIndex: 'total_vehicles',
      key: 'total_vehicles',
      sorter: (a, b) => a.total_vehicles - b.total_vehicles,
    },
    {
      title: '总收入(元)',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (value: number) => `¥${value.toFixed(2)}`,
      sorter: (a, b) => a.total_revenue - b.total_revenue,
    },
    {
      title: '当前占用',
      dataIndex: 'current_occupancy',
      key: 'current_occupancy',
    },
    {
      title: '占用率',
      dataIndex: 'occupancy_rate',
      key: 'occupancy_rate',
      render: (value: number) => (
        <Progress
          percent={Math.round(value * 100)}
          size="small"
          status={value > 0.9 ? 'exception' : 'normal'}
        />
      ),
      sorter: (a, b) => a.occupancy_rate - b.occupancy_rate,
    },
  ];

  const hourlyData = statistics.hourly_distribution
    ? Object.entries(statistics.hourly_distribution).map(([hour, count]) => ({
        hour: `${hour}:00`,
        count,
      }))
    : [];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <RangePicker
            value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
            onChange={handleDateRangeChange}
          />
        </Space>

        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总车流量"
                value={statistics.total_vehicles}
                prefix={<CarOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总收入"
                value={statistics.total_revenue}
                precision={2}
                prefix={<DollarOutlined />}
                suffix="元"
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均停车时长"
                value={statistics.average_duration}
                precision={1}
                prefix={<ClockCircleOutlined />}
                suffix="小时"
                loading={loading}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="当前在场车辆"
                value={statistics.current_occupancy}
                prefix={<BarChartOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title="停车场统计">
        <Table
          columns={columns}
          dataSource={statistics.lot_statistics}
          rowKey="lot_id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Card title="24小时车流量分布">
        {hourlyData.length > 0 ? (
          <Line
            data={hourlyData}
            loading={loading}
            xField="hour"
            yField="count"
            xAxis={{
              title: { text: '时间' },
            }}
            yAxis={{
              title: { text: '车辆数' },
            }}
            smooth
            point={{
              size: 3,
              shape: 'circle',
            }}
          />
        ) : (
          <Empty description="暂无数据" />
        )}
      </Card>
    </Space>
  );
};

export default Statistics;