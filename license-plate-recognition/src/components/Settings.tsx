import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Space,
  Modal,
  Typography,
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api, { ParkingLot } from '../services/api';

const { Title } = Typography;

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentLot, setCurrentLot] = useState<ParkingLot | null>(null);
  const [form] = Form.useForm();

  const fetchParkingLots = async () => {
    try {
      setLoading(true);
      const data = await api.getAllParkingLots();
      setParkingLots(data);
    } catch (error) {
      message.error('获取停车场信息失败');
      console.error('Error fetching parking lots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingLots();
  }, []);

  const handleEdit = (record: ParkingLot) => {
    setCurrentLot(record);
    form.setFieldsValue(record);
    setEditModalVisible(true);
  };

  const handleSave = async (values: any) => {
    if (!currentLot) return;
    
    try {
      setLoading(true);
      await api.updateParkingLot(currentLot.id, values);
      message.success('更新成功');
      setEditModalVisible(false);
      fetchParkingLots();
    } catch (error) {
      message.error('更新失败');
      console.error('Error updating parking lot:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<ParkingLot> = [
    {
      title: '停车场名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '车位容量',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 120,
    },
    {
      title: '每小时收费(元)',
      dataIndex: 'hourly_rate',
      key: 'hourly_rate',
      width: 150,
      render: (rate: number) => `¥${rate.toFixed(2)}`,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Title level={4}>停车场设置</Title>
        
        <Table
          columns={columns}
          dataSource={parkingLots}
          rowKey="id"
          loading={loading}
          pagination={false}
        />

        <Modal
          title="编辑停车场信息"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={currentLot || {}}
          >
            <Form.Item
              name="name"
              label="停车场名称"
              rules={[{ required: true, message: '请输入停车场名称' }]}
            >
              <Input placeholder="请输入停车场名称" />
            </Form.Item>

            <Form.Item
              name="capacity"
              label="车位容量"
              rules={[{ required: true, message: '请输入车位容量' }]}
            >
              <InputNumber
                min={1}
                max={1000}
                style={{ width: '100%' }}
                placeholder="请输入车位容量"
              />
            </Form.Item>

            <Form.Item
              name="hourly_rate"
              label="每小时收费(元)"
              rules={[{ required: true, message: '请输入每小时收费' }]}
            >
              <InputNumber
                min={0}
                max={100}
                step={0.5}
                precision={2}
                style={{ width: '100%' }}
                placeholder="请输入每小时收费"
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
            >
              <Input.TextArea
                rows={4}
                placeholder="请输入停车场描述"
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存
                </Button>
                <Button onClick={() => setEditModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Card>
  );
};

export default Settings;