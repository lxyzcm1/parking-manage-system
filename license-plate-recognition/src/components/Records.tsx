import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Image,
  DatePicker
} from 'antd';
import { SearchOutlined, PrinterOutlined, FileSearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TableProps } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { RangePicker } = DatePicker;

interface ParkingRecord {
  id: string;
  plateNumber: string;
  entryTime: Date;
  exitTime: Date;
  duration: string;
  fee: number;
  status: 'paid' | 'unpaid';
  entryImage: string;
  exitImage: string;
}

const Records = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const [tableParams, setTableParams] = useState<{
    pagination: {
      current: number;
      pageSize: number;
      total: number;
    };
    sortField: string | null;
    sortOrder: string | null;
    filters: Record<string, FilterValue | null>;
  }>({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    sortField: null,
    sortOrder: null,
    filters: {},
  });

  // 模拟数据
  const mockData: ParkingRecord[] = [
    {
      id: '1',
      plateNumber: '京A12345',
      entryTime: new Date('2024-03-20 08:00:00'),
      exitTime: new Date('2024-03-20 10:30:00'),
      duration: '2小时30分钟',
      fee: 15,
      status: 'paid',
      entryImage: 'https://example.com/entry1.jpg',
      exitImage: 'https://example.com/exit1.jpg',
    },
    // ... 更多模拟数据
  ];

  const columns: ColumnsType<ParkingRecord> = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      filters: [
        { text: '京A', value: '京A' },
        { text: '京B', value: '京B' },
      ],
      onFilter: (value: string | number | boolean | bigint, record) => 
        record.plateNumber.includes(String(value)),
      render: (text) => <a onClick={() => handleRecordDetail(text)}>{text}</a>,
    },
    {
      title: '入场时间',
      dataIndex: 'entryTime',
      key: 'entryTime',
      sorter: true,
      render: (date) => date.toLocaleString(),
    },
    {
      title: '出场时间',
      dataIndex: 'exitTime',
      key: 'exitTime',
      sorter: true,
      render: (date) => date.toLocaleString(),
    },
    {
      title: '停车时长',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '收费金额',
      dataIndex: 'fee',
      key: 'fee',
      sorter: true,
      render: (fee) => `¥${fee.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : 'red'}>
          {status === 'paid' ? '已支付' : '未支付'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            onClick={() => handleViewImage(record.entryImage)}
            icon={<FileSearchOutlined />}
          >
            入场照片
          </Button>
          <Button
            type="link"
            onClick={() => handleViewImage(record.exitImage)}
            icon={<FileSearchOutlined />}
          >
            出场照片
          </Button>
          <Button
            type="link"
            onClick={() => handlePrintRecord(record)}
            icon={<PrinterOutlined />}
          >
            打印
          </Button>
        </Space>
      ),
    },
  ];

  const handleTableChange: TableProps<ParkingRecord>['onChange'] = (
    pagination,
    filters,
    sorter
  ) => {
    setTableParams({
      pagination: {
        current: pagination.current ?? 1,
        pageSize: pagination.pageSize ?? 10,
        total: pagination.total ?? 0,
      },
      filters,
      sortField: (sorter as SorterResult<ParkingRecord>).field as string,
      sortOrder: (sorter as SorterResult<ParkingRecord>).order as string,
    });

    // 这里应该调用后端API获取数据
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleSearch = () => {
    setTableParams({
      ...tableParams,
      pagination: { ...tableParams.pagination, current: 1 },
    });
    // 这里应该调用后端API搜索数据
  };

  const handleViewImage = (imageUrl: string) => {
    setCurrentImage(imageUrl);
    setImageModalVisible(true);
  };

  const handleRecordDetail = (plateNumber: string) => {
    const record = mockData.find(r => r.plateNumber === plateNumber);
    if (record) {
      Modal.info({
        title: '停车记录详情',
        width: 600,
        content: (
          <div>
            <p>车牌号：{record.plateNumber}</p>
            <p>入场时间：{record.entryTime.toLocaleString()}</p>
            <p>出场时间：{record.exitTime.toLocaleString()}</p>
            <p>停车时长：{record.duration}</p>
            <p>收费金额：¥{record.fee.toFixed(2)}</p>
            <p>支付状态：{record.status === 'paid' ? '已支付' : '未支付'}</p>
          </div>
        ),
      });
    }
  };

  const handlePrintRecord = async (record: ParkingRecord) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 20px;">
        <h2>停车收费凭据</h2>
        <p>车牌号：${record.plateNumber}</p>
        <p>入场时间：${record.entryTime.toLocaleString()}</p>
        <p>出场时间：${record.exitTime.toLocaleString()}</p>
        <p>停车时长：${record.duration}</p>
        <p>收费金额：¥${record.fee.toFixed(2)}</p>
        <p>支付状态：${record.status === 'paid' ? '已支付' : '未支付'}</p>
      </div>
    `;
    document.body.appendChild(element);

    try {
      const canvas = await html2canvas(element);
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297);
      pdf.save(`parking-receipt-${record.plateNumber}.pdf`);
    } finally {
      document.body.removeChild(element);
    }
  };

  return (
    <Card title="停车记录">
      <Space style={{ marginBottom: 16 }}>
        <RangePicker />
        <Input
          placeholder="搜索车牌号"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 200 }}
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={handleSearch}
        >
          搜索
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        loading={loading}
        onChange={handleTableChange}
        pagination={tableParams.pagination}
      />

      <Modal
        open={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
        footer={null}
      >
        <Image
          src={currentImage}
          alt="车辆照片"
          style={{ width: '100%' }}
        />
      </Modal>
    </Card>
  );
};

export default Records;