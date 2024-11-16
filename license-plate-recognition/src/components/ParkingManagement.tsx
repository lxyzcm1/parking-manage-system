import { useState } from 'react';
import { Card, Row, Col, Modal, message } from 'antd';
import PlateRecognition from './PlateRecognition';

interface ParkingRecord {
  plateNumber: string;
  entryTime: Date;
  exitTime?: Date;
  fee?: number;
  status: 'parked' | 'exited';
  image: string;
}

const ParkingManagement = () => {
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [gateOpen, setGateOpen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ParkingRecord | null>(null);

  const handleEntry = (plateNumber: string, image: string) => {
    const newRecord: ParkingRecord = {
      plateNumber,
      entryTime: new Date(),
      status: 'parked',
      image
    };
    setRecords([...records, newRecord]);
    message.success('车辆入场成功');
    
    // 打开道闸
    setGateOpen(true);
    
    // 3秒后关闭道闸
    setTimeout(() => {
      setGateOpen(false);
    }, 3000);
  };

  const handleExit = (plateNumber: string) => {
    const record = records.find(
      r => r.plateNumber === plateNumber && r.status === 'parked'
    );

    if (record) {
      setCurrentRecord({
        ...record,
        exitTime: new Date(),
        fee: calculateFee(record.entryTime, new Date())
      });
      setShowPayment(true);
    } else {
      message.error('未找到该车辆的入场记录');
    }
  };

  const calculateFee = (entryTime: Date, exitTime: Date): number => {
    const hours = Math.ceil((exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60));
    return hours * 5; // 假设每小时5元
  };

  const handlePayment = () => {
    if (currentRecord) {
      setRecords(records.map(r =>
        r.plateNumber === currentRecord.plateNumber ?
        { ...currentRecord, status: 'exited' } : r
      ));
      setShowPayment(false);
      setGateOpen(true);

      // 3秒后关闭道闸
      setTimeout(() => {
        setGateOpen(false);
      }, 3000);
    }
  };

  return (
    <div>
      <Row gutter={24}>
        <Col span={12}>
          <Card title="车辆入场">
            <PlateRecognition onRecognized={(plate) => handleEntry(plate.code, plate.image)} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="车辆出场">
            <PlateRecognition onRecognized={(plate) => handleExit(plate.code)} />
          </Card>
        </Col>
      </Row>

      {/* 道闸动画 */}
      <div style={{
        marginTop: 20,
        height: 100,
        position: 'relative',
        border: '1px solid #ddd'
      }}>
        <div style={{
          width: 10,
          height: gateOpen ? 10 : 80,
          background: '#000',
          position: 'absolute',
          left: '50%',
          top: 10,
          transition: 'all 0.5s',
          transformOrigin: 'top',
          transform: gateOpen ? 'rotate(90deg)' : 'rotate(0deg)'
        }} />
      </div>

      <Modal
        title="支付停车费"
        open={showPayment}
        onOk={handlePayment}
        onCancel={() => setShowPayment(false)}
      >
        {currentRecord && (
          <div>
            <p>车牌号：{currentRecord.plateNumber}</p>
            <p>入场时间：{currentRecord.entryTime.toLocaleString()}</p>
            <p>出场时间：{currentRecord.exitTime?.toLocaleString()}</p>
            <p>停车费用：¥{currentRecord.fee}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ParkingManagement;