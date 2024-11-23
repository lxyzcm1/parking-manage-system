import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Row, Col, message, Select, Space, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile, UploadProps } from 'antd/es/upload';
import api, { ParkingLot, ParkingRecord } from '../services/api';
import GateAnimation from './GateAnimation';
import styled from 'styled-components';

const { Title } = Typography;

const AnimationWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f2f5;
  padding: 20px;
  border-radius: 8px;
`;

const StyledCard = styled(Card)`
  .ant-card-body {
    min-height: 400px;
  }
`;

const ParkingManagement: React.FC = () => {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [entryFile, setEntryFile] = useState<UploadFile | null>(null);
  const [exitFile, setExitFile] = useState<UploadFile | null>(null);
  const [selectedLot, setSelectedLot] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEntry, setIsEntry] = useState(true);
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

  const handleEntryUpload = async () => {
    if (!selectedLot) {
      message.error('请选择停车场');
      return;
    }

    if (!entryFile) {
      message.error('请选择入场图片');
      return;
    }

    try {
      setLoading(true);
      setIsEntry(true);
      setIsAnimating(true);

      const response = await api.vehicleEntry(selectedLot, entryFile.originFileObj as File);
      message.success(`车牌号 ${response.plate_number} 已入场`);
      setEntryFile(null);
      setLastRecord(response);
    } catch (error) {
      message.error('入场处理失败');
      setIsAnimating(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExitUpload = async () => {
    if (!exitFile) {
      message.error('请选择出场图片');
      return;
    }

    try {
      setLoading(true);
      setIsEntry(false);
      setIsAnimating(true);

      const response = await api.vehicleExit(exitFile.originFileObj as File);
      message.success(`车牌号 ${response.plate_number} 已出场，费用：${response.fee}元`);
      setExitFile(null);
      setLastRecord(response);
    } catch (error) {
      message.error('出场处理失败');
      setIsAnimating(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      return false;
    },
    maxCount: 1,
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      <Title level={2}>停车场管理</Title>
      <Row gutter={24}>
        <Col span={12}>
          <StyledCard title="车辆入场">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                style={{ width: '100%' }}
                placeholder="选择停车场"
                onChange={(value) => setSelectedLot(value)}
                options={parkingLots.map((lot) => ({
                  value: lot.id,
                  label: `${lot.name} (每小时${lot.hourly_rate}元)`,
                }))}
              />
              <Upload
                {...uploadProps}
                fileList={entryFile ? [entryFile] : []}
                onChange={({ fileList }) => setEntryFile(fileList[0])}
              >
                <Button icon={<UploadOutlined />}>选择入场图片</Button>
              </Upload>
              <Button
                type="primary"
                onClick={handleEntryUpload}
                loading={loading && isEntry}
                disabled={!entryFile || !selectedLot || isAnimating}
                style={{ width: '100%' }}
              >
                确认入场
              </Button>
            </Space>
            <AnimationWrapper>
              {isEntry && (
                <GateAnimation
                  isEntry={true}
                  isAnimating={isAnimating}
                  onAnimationComplete={handleAnimationComplete}
                />
              )}
            </AnimationWrapper>
          </StyledCard>
        </Col>
        <Col span={12}>
          <StyledCard title="车辆出场">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                {...uploadProps}
                fileList={exitFile ? [exitFile] : []}
                onChange={({ fileList }) => setExitFile(fileList[0])}
              >
                <Button icon={<UploadOutlined />}>选择出场图片</Button>
              </Upload>
              <Button
                type="primary"
                onClick={handleExitUpload}
                loading={loading && !isEntry}
                disabled={!exitFile || isAnimating}
                style={{ width: '100%' }}
              >
                确认出场
              </Button>
            </Space>
            <AnimationWrapper>
              {!isEntry && (
                <GateAnimation
                  isEntry={false}
                  isAnimating={isAnimating}
                  onAnimationComplete={handleAnimationComplete}
                />
              )}
            </AnimationWrapper>
          </StyledCard>
        </Col>
      </Row>

      {lastRecord && (
        <Card title="最近记录">
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
        </Card>
      )}
    </Space>
  );
};

export default ParkingManagement;