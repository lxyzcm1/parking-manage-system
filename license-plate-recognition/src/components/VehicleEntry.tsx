import React, { useState, useEffect } from 'react';
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
  Image,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import type { UploadFile } from 'antd/es/upload/interface';
import api from '../services/api';
import './ParkingManagement.css';
import GateAnimation from './GateAnimation';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ContentRow = styled.div`
  display: flex;
  gap: 24px;
  min-height: 400px;
`;

const LeftPanel = styled.div`
  flex: 1;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const ImagePreview = styled.div`
  margin-top: 24px;
  width: 100%;
  
  .ant-image {
    width: 100%;
    
    img {
      width: 100%;
      max-height: 200px;
      object-fit: contain;
      border-radius: 4px;
      border: 1px solid #d9d9d9;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        border-color: #1890ff;
        box-shadow: 0 0 8px rgba(24, 144, 255, 0.2);
      }
    }
  }
`;

const VehicleEntry: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [selectedLot, setSelectedLot] = useState<number>();
  const [parkingLots, setParkingLots] = useState<Array<{ value: number; label: string }>>([]);
  const [entryFile, setEntryFile] = useState<UploadFile | null>(null);
  const [plateNumber, setPlateNumber] = useState<string>('');
  const [showGateAnimation, setShowGateAnimation] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
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
      setShowGateAnimation(true);
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
    
    // Create a preview URL for the image
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setEntryFile(file);
    return false;
  };

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  return (
    <Card title="车辆入场" className="parking-card">
      <Spin spinning={loading}>
        <LayoutContainer>
          <ContentRow>
            <LeftPanel>
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
                  onRemove={() => {
                    setEntryFile(null);
                    setImageUrl('');
                  }}
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
                {imageUrl && (
                  <ImagePreview>
                    <Image
                      src={imageUrl}
                      alt="车牌照片"
                      preview={{
                        mask: '点击查看大图'
                      }}
                    />
                  </ImagePreview>
                )}
              </div>
            </LeftPanel>
            <RightPanel>
              {showGateAnimation ? (
                <GateAnimation
                  isEntry={true}
                  isAnimating={true}
                  onAnimationComplete={() => {
                    setShowGateAnimation(false);
                    message.success('车辆入场成功');
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                  等待车辆入场...
                </div>
              )}
            </RightPanel>
          </ContentRow>

          {plateNumber && (
            <Row gutter={16}>
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
        </LayoutContainer>
      </Spin>
    </Card>
  );
};

export default VehicleEntry;
