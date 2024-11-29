import React, { useState } from 'react';
import {
  Card,
  Upload,
  Select,
  Button,
  message,
  Spin,
  Statistic,
  Row,
  Col,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import type { UploadFile } from 'antd/es/upload/interface';
import api from '../services/api';
import './ParkingManagement.css';

const VehicleEntry: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedLot, setSelectedLot] = useState<number>();
  const [parkingLots, setParkingLots] = useState<Array<{ value: number; label: string }>>([]);
  const [entryFile, setEntryFile] = useState<UploadFile | null>(null);
  const [plateNumber, setPlateNumber] = useState<string>('');

  React.useEffect(() => {
    fetchParkingLots();
  }, []);

  const fetchParkingLots = async () => {
    try {
      const lots = await api.getParkingLots();
      setParkingLots(
        lots.map((lot) => ({
          value: lot.id,
          label: lot.name,
        }))
      );
    } catch (error) {
      message.error('获取停车场列表失败');
      console.error('Error fetching parking lots:', error);
    }
  };

  const handleEntryUpload = async () => {
    if (!selectedLot) {
      message.error('请选择停车场');
      return;
    }

    if (!entryFile) {
      message.error('请上传车牌照片');
      return;
    }

    try {
      setLoading(true);
      const result = await api.vehicleEntry(selectedLot, entryFile as RcFile);
      setPlateNumber(result.plate_number || '无法识别');
      message.success('车辆入场成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '车辆入场失败');
      console.error('Error handling entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }
    setEntryFile(file);
    return false;
  };

  return (
    <Card title="车辆入场" className="parking-card">
      <Spin spinning={loading}>
        <div className="upload-section">
          <Select
            placeholder="选择停车场"
            style={{ width: '100%', marginBottom: 16 }}
            options={parkingLots}
            onChange={(value) => setSelectedLot(value)}
          />
          <Upload
            accept="image/*"
            maxCount={1}
            beforeUpload={beforeUpload}
            onRemove={() => setEntryFile(null)}
            fileList={entryFile ? [entryFile] : []}
          >
            <Button icon={<UploadOutlined />}>上传车牌照片</Button>
          </Upload>
          <Button
            type="primary"
            onClick={handleEntryUpload}
            style={{ marginTop: 16 }}
            disabled={!selectedLot || !entryFile}
          >
            确认入场
          </Button>
        </div>

        {plateNumber && (
          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={24}>
              <Card>
                <Statistic
                  title="识别结果"
                  value={plateNumber}
                  valueStyle={
                    plateNumber === '无法识别'
                      ? { color: '#ff4d4f' }
                      : { color: '#52c41a' }
                  }
                />
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </Card>
  );
};

export default VehicleEntry;
