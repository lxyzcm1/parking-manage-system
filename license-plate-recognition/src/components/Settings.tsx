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
import { EditOutlined, LockOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api, { ParkingLot } from '../services/api';
import './Settings.css';

const { Title } = Typography;

// 管理员密码 - 实际应用中应该从后端验证
const ADMIN_PASSWORD = '123456';

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentLot, setCurrentLot] = useState<ParkingLot | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

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
    if (!isAuthenticated) {
      setPasswordModalVisible(true);
      setCurrentLot(record);
      return;
    }
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

  const handlePasswordSubmit = async (values: { password: string }) => {
    if (values.password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordModalVisible(false);
      message.success('验证成功');
      if (currentLot) {
        form.setFieldsValue(currentLot);
        setEditModalVisible(true);
      }
    } else {
      message.error('密码错误');
      passwordForm.resetFields();
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
    <Card className="settings-card">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Title level={4} className="settings-title">停车场设置</Title>
        
        <Table
          columns={columns}
          dataSource={parkingLots}
          rowKey="id"
          loading={loading}
          pagination={false}
          className="settings-table"
        />

        {/* 密码验证弹窗 */}
        <Modal
          title="管理员验证"
          open={passwordModalVisible}
          onCancel={() => {
            setPasswordModalVisible(false);
            passwordForm.resetFields();
          }}
          footer={null}
          className="settings-modal"
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSubmit}
          >
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入管理员密码' }]}
              className="settings-form-item"
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入管理员密码"
                className="settings-input"
              />
            </Form.Item>

            <Form.Item className="settings-form-item">
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确认
                </Button>
                <Button onClick={() => {
                  setPasswordModalVisible(false);
                  passwordForm.resetFields();
                }}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 编辑信息弹窗 */}
        <Modal
          title="编辑停车场信息"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
          className="settings-modal"
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
              className="settings-form-item"
            >
              <Input placeholder="请输入停车场名称" className="settings-input" />
            </Form.Item>

            <Form.Item
              name="capacity"
              label="车位容量"
              rules={[{ required: true, message: '请输入车位容量' }]}
              className="settings-form-item"
            >
              <InputNumber
                min={1}
                max={1000}
                style={{ width: '100%' }}
                placeholder="请输入车位容量"
                className="settings-input-number"
              />
            </Form.Item>

            <Form.Item
              name="hourly_rate"
              label="每小时收费(元)"
              rules={[{ required: true, message: '请输入每小时收费' }]}
              className="settings-form-item"
            >
              <InputNumber
                min={0}
                max={100}
                step={0.5}
                precision={2}
                style={{ width: '100%' }}
                placeholder="请输入每小时收费"
                className="settings-input-number"
              />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
              className="settings-form-item"
            >
              <Input.TextArea
                rows={4}
                placeholder="请输入停车场描述"
                className="settings-textarea"
              />
            </Form.Item>

            <Form.Item className="settings-form-item">
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