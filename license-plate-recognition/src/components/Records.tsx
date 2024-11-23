import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Input,
  DatePicker,
  Space,
  Select,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api, { ParkingRecord, RecordQueryParams } from '../services/api';

const { RangePicker } = DatePicker;

const Records: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [filters, setFilters] = useState<RecordQueryParams>({});

  const fetchRecords = async (params: RecordQueryParams = {}) => {
    try {
      setLoading(true);
      const data = await api.getParkingRecords(params);
      const transformedRecords: ParkingRecord[] = data.map(record => ({
        plate_number: record.plate_number,
        entry_time: record.entry_time,
        exit_time: record.exit_time || undefined,
        duration: record.duration || undefined,
        fee: record.fee || undefined,
        parking_lot: record.parking_lot_name
      }));
      setRecords(transformedRecords);
    } catch (error) {
      message.error('获取停车记录失败');
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(filters);
  }, [filters]);

  const columns: ColumnsType<ParkingRecord> = [
    {
      title: '车牌号',
      dataIndex: 'plate_number',
      key: 'plate_number',
      width: 120,
    },
    {
      title: '停车场',
      dataIndex: 'parking_lot',
      key: 'parking_lot',
      width: 150,
    },
    {
      title: '入场时间',
      dataIndex: 'entry_time',
      key: 'entry_time',
      width: 180,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '出场时间',
      dataIndex: 'exit_time',
      key: 'exit_time',
      width: 180,
      render: (time: string | null) =>
        time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '停车时长(小时)',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      render: (duration: number | null) =>
        duration ? duration.toFixed(1) : '-',
    },
    {
      title: '费用(元)',
      dataIndex: 'fee',
      key: 'fee',
      width: 100,
      render: (fee: number | null) => (fee ? `¥${fee.toFixed(2)}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === '在场' ? 'processing' : 'success'}>
          {status}
        </Tag>
      ),
    },
  ];

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setFilters({
        ...filters,
        start_date: dates[0].format('YYYY-MM-DD'),
        end_date: dates[1].format('YYYY-MM-DD'),
      });
    } else {
      const { start_date, end_date, ...rest } = filters;
      setFilters(rest);
    }
  };

  const handlePlateNumberChange = (value: string) => {
    if (value) {
      setFilters({ ...filters, plate_number: value });
    } else {
      const { plate_number, ...rest } = filters;
      setFilters(rest);
    }
  };

  const handleStatusChange = (value: string | null) => {
    if (value) {
      setFilters({ ...filters, status: value });
    } else {
      const { status, ...rest } = filters;
      setFilters(rest);
    }
  };

  return (
    <Card title="停车记录">
      <Space style={{ marginBottom: 16 }}>
        <RangePicker
          onChange={handleDateRangeChange}
          placeholder={['开始日期', '结束日期']}
        />
        <Input
          placeholder="搜索车牌号"
          prefix={<SearchOutlined />}
          onChange={(e) => handlePlateNumberChange(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
        <Select
          placeholder="选择状态"
          style={{ width: 120 }}
          allowClear
          onChange={handleStatusChange}
          options={[
            { value: '在场', label: '在场' },
            { value: '已离场', label: '已离场' },
          ]}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }}
      />
    </Card>
  );
};

export default Records;