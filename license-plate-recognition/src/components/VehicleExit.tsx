import React, { useState } from 'react';
import {
  Card,
  Upload,
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

const VehicleExit: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exitFile, setExitFile] = useState<UploadFile | null>(null);
  const [exitResult, setExitResult] = useState<{
    plate_number?: string;
    duration?: number;
    fee?: number;
  } | null>(null);

  const handleExitUpload = async () => {
    if (!exitFile) {
      message.error('请上传车牌照片');
      return;
    }

    try {
      setLoading(true);
      const result = await api.vehicleExit(exitFile as RcFile);
      setExitResult({
        plate_number: result.plate_number || '无法识别',
        duration: result.duration,
        fee: result.fee,
      });
      message.success('车辆出场成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '车辆出场失败');
      console.error('Error handling exit:', error);
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
    setExitFile(file);
    return false;
  };

  return (
    <Card title="车辆出场" className="parking-card">
      <Spin spinning={loading}>
        <div className="upload-section">
          <Upload
            accept="image/*"
            maxCount={1}
            beforeUpload={beforeUpload}
            onRemove={() => setExitFile(null)}
            fileList={exitFile ? [exitFile] : []}
          >
            <Button icon={<UploadOutlined />}>上传车牌照片</Button>
          </Upload>
          <Button
            type="primary"
            onClick={handleExitUpload}
            style={{ marginTop: 16 }}
            disabled={!exitFile}
          >
            确认出场
          </Button>
        </div>

        {exitResult && (
          <Row gutter={16} style={{ marginTop: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="车牌号"
                  value={exitResult.plate_number}
                  valueStyle={
                    exitResult.plate_number === '无法识别'
                      ? { color: '#ff4d4f' }
                      : { color: '#52c41a' }
                  }
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="停车时长"
                  value={exitResult.duration?.toFixed(1) || '-'}
                  suffix="小时"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="停车费用"
                  value={exitResult.fee?.toFixed(2) || '-'}
                  prefix="¥"
                />
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </Card>
  );
};

export default VehicleExit;
