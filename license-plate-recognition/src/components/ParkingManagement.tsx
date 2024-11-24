import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Row, Col, message, Select, Space, Typography, Statistic } from 'antd';
import { UploadOutlined, HistoryOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { RcFile, UploadProps } from 'antd/es/upload';
import api, { ParkingLot, ParkingRecord } from '../services/api';
import GateAnimation from './GateAnimation';
import styled from 'styled-components';
import dayjs from 'dayjs';

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

      const selectedParkingLot = parkingLots.find(lot => lot.id === selectedLot);
      const response = await api.vehicleEntry(selectedLot, entryFile.originFileObj as File);
      message.success(`车牌号 ${response.plate_number} 已入场`);
      setEntryFile(null);
      setLastRecord({
        plate_number: response.plate_number,
        parking_lot: selectedParkingLot?.name || '',
        entry_time: response.entry_time,
        exit_time: undefined,
        fee: undefined
      });
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
      console.log('Exit Response:', response); // 添加日志查看响应数据

      if (response) {
        message.success(`车牌号 ${response.plate_number} 已出场，费用：${response.fee}元`);
        setExitFile(null);

        // 确保所有必要的字段都存在
        const record = {
          plate_number: response.plate_number,
          parking_lot: response.parking_lot || response.parking_lot_name || '未知停车场',
          entry_time: response.entry_time,
          exit_time: response.exit_time || new Date().toISOString(),
          fee: response.fee || 0
        };

        console.log('Processed Record:', record); // 添加日志查看处理后的数据
        setLastRecord(record);
      } else {
        message.error('无效的响应数据');
      }
    } catch (error) {
      console.error('Exit error:', error);
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
    beforeUpload: (file: RcFile) => {
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
        <Card
          title={
            <span>
              <HistoryOutlined style={{ marginRight: 8 }} />
              最近记录
            </span>
          }
          style={{ marginTop: 24 }}
        >
          <Row gutter={[24, 16]}>
            <Col span={8}>
              <Statistic
                title="车牌号"
                value={lastRecord.plate_number}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="停车场"
                value={lastRecord.parking_lot}
              />
            </Col>
            {!lastRecord.exit_time ? (
              // 入场记录显示
              <Col span={8}>
                <Statistic
                  title="入场时间"
                  value={dayjs(lastRecord.entry_time).format('YYYY-MM-DD HH:mm:ss')}
                />
              </Col>
            ) : (
              // 出场记录显示
              <>
                <Col span={8}>
                  <Statistic
                    title="出场时间"
                    value={dayjs(lastRecord.exit_time).format('YYYY-MM-DD HH:mm:ss')}
                  />
                </Col>
                <Col span={8} offset={8}>
                  <Statistic
                    title="费用"
                    value={lastRecord.fee || 0}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
              </>
            )}
          </Row>
        </Card>
      )}
    </Space>
  );
};

export default ParkingManagement;