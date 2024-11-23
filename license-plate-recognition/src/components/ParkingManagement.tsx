import React, { useState, useEffect } from 'react';
import {
  Form,
  Upload,
  Button,
  message,
  Card,
  Select,
  Row,
  Col,
  Typography,
  Space,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import api, { ParkingLot, ParkingRecord } from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const ParkingManagement: React.FC = () => {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [entryForm] = Form.useForm();
  const [exitForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [lastRecord, setLastRecord] = useState<ParkingRecord | null>(null);

  useEffect(() => {
    loadParkingLots();
  }, []);

  const loadParkingLots = async () => {
    try {
      const lots = await api.getParkingLots();
      setParkingLots(lots);
    } catch (error) {
      message.error('加载停车场信息失败');
    }
  };

  const handleEntrySubmit = async (values: any) => {
    try {
      setLoading(true);
      const image = values.image.file;
      const response = await api.vehicleEntry(values.parkingLotId, image);
      message.success(`车辆入场成功！车牌号：${response.plate_number}`);
      setLastRecord(response);
      entryForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '车辆入场失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExitSubmit = async (values: any) => {
    try {
      setLoading(true);
      const image = values.image.file;
      const response = await api.vehicleExit(image);
      message.success(
        `车辆出场成功！\n车牌号：${response.plate_number}\n停车时长：${response.duration?.toFixed(
          2
        )}小时\n费用：${response.fee?.toFixed(2)}元`
      );
      setLastRecord(response);
      exitForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '车辆出场失败');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: () => false,
    maxCount: 1,
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>停车场管理系统</Title>
      <Row gutter={24}>
        <Col span={12}>
          <Card title="车辆入场">
            <Form form={entryForm} onFinish={handleEntrySubmit}>
              <Form.Item
                name="parkingLotId"
                label="选择停车场"
                rules={[{ required: true, message: '请选择停车场' }]}
              >
                <Select placeholder="请选择停车场">
                  {parkingLots.map((lot) => (
                    <Option key={lot.id} value={lot.id}>
                      {lot.name} (每小时{lot.hourly_rate}元)
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="image"
                label="车辆图片"
                rules={[{ required: true, message: '请上传车辆图片' }]}
              >
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>上传图片</Button>
                </Upload>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确认入场
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="车辆出场">
            <Form form={exitForm} onFinish={handleExitSubmit}>
              <Form.Item
                name="image"
                label="车辆图片"
                rules={[{ required: true, message: '请上传车辆图片' }]}
              >
                <Upload {...uploadProps}>
                  <Button icon={<UploadOutlined />}>上传图片</Button>
                </Upload>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  确认出场
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {lastRecord && (
        <Card title="最近记录" style={{ marginTop: '24px' }}>
          <Space direction="vertical">
            <p>车牌号：{lastRecord.plate_number}</p>
            <p>停车场：{lastRecord.parking_lot}</p>
            <p>入场时间：{lastRecord.entry_time}</p>
            {lastRecord.exit_time && (
              <>
                <p>出场时间：{lastRecord.exit_time}</p>
                <p>停车时长：{lastRecord.duration?.toFixed(2)}小时</p>
                <p>费用：{lastRecord.fee?.toFixed(2)}元</p>
              </>
            )}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default ParkingManagement;