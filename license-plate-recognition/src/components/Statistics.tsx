import { Card, DatePicker, Table, Row, Col, Statistic } from 'antd';
import { useState } from 'react';
import type { RangePickerProps } from 'antd/es/date-picker';

const { RangePicker } = DatePicker;

const Statistics = () => {
  const [loading, setLoading] = useState(false);

  const onDateRangeChange = (
    dates: RangePickerProps['value']
  ) => {
    if (dates) {
      setLoading(true);
      // 这里应该调用后端API获取统计数据
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '车辆数量',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '收费金额',
      dataIndex: 'amount',
      key: 'amount',
    },
  ];

  return (
    <>
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card>
            <Statistic title="今日车流量" value={123} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日收入" value={1580} prefix="¥" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本月车流量" value={3245} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本月收入" value={45800} prefix="¥" />
          </Card>
        </Col>
      </Row>

      <Card
        title="收费统计"
        extra={
          <RangePicker
            onChange={onDateRangeChange}
            style={{ marginBottom: 16 }}
          />
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={[]}
          rowKey="date"
        />
      </Card>
    </>
  );
};

export default Statistics;