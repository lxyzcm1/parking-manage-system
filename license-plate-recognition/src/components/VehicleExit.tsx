import React, { useState, useEffect } from 'react';
import {
  Card,
  Upload,
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

const VehicleExit: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exitFile, setExitFile] = useState<UploadFile | null>(null);
  const [exitResult, setExitResult] = useState<{
    plate_number?: string;
    duration?: number;
    fee?: number;
  } | null>(null);
  const [showGateAnimation, setShowGateAnimation] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

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
      setShowGateAnimation(true);
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
    
    // Create a preview URL for the image
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setExitFile(file);
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
    <Card title="车辆出场" className="parking-card">
      <Spin spinning={loading}>
        <LayoutContainer>
          <ContentRow>
            <LeftPanel>
              <div className="upload-section">
                <Upload
                  accept="image/*"
                  maxCount={1}
                  beforeUpload={beforeUpload}
                  onRemove={() => {
                    setExitFile(null);
                    setImageUrl('');
                  }}
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
                  isEntry={false}
                  isAnimating={true}
                  onAnimationComplete={() => {
                    setShowGateAnimation(false);
                    message.success('车辆出场成功');
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                  等待车辆出场...
                </div>
              )}
            </RightPanel>
          </ContentRow>

          {exitResult && (
            <Row gutter={16}>
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
        </LayoutContainer>
      </Spin>
    </Card>
  );
};

export default VehicleExit;
