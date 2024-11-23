import React, { useState } from 'react';
import { Card, DatePicker, Button, Row, Col, Statistic, message } from 'antd';
import api, { StatisticsData } from '../services/api';
import { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Statistics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatisticsData | null>(null);

  const handleDateRangeChange = async (dates: any) => {
    if (!dates || !dates[0] || !dates[1]) return;

    try {
      setLoading(true);
      const startDate = dates[0].format('YYYY-MM-DD');
      const endDate = dates[1].format('YYYY-MM-DD');
      
      const data = await api.getStatistics(startDate, endDate);
      setStats(data);
    } catch (error: any) {
      message.error(error.response?.data?.detail || '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current > dayjs().endOf('day');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="停车场统计数据">
        <div style={{ marginBottom: '24px' }}>
          <RangePicker
            onChange={handleDateRangeChange}
            disabledDate={disabledDate}
            style={{ width: '100%' }}
          />
        </div>

        {stats && (
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="总车辆数"
                value={stats.total_vehicles}
                suffix="辆"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="总收入"
                value={stats.total_revenue}
                precision={2}
                prefix="¥"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="平均停车时长"
                value={stats.average_duration}
                precision={1}
                suffix="小时"
              />
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );
};

export default Statistics;