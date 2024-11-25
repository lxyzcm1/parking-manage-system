import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Progress,
  Space,
  Empty,
  message,
  Button,
} from 'antd';
import {
  CarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api, { ParkingLotStatistics, ParkingStatistics } from '../services/api';
import './Statistics.css';

const { RangePicker } = DatePicker;

const defaultStats: ParkingStatistics = {
  total_vehicles: 0,
  total_revenue: 0,
  average_duration: 0,
  current_occupancy: 0,
  lot_statistics: [],
  hourly_distribution: {},
};

const Statistics: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<ParkingStatistics>(defaultStats);
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await api.getParkingStatistics(dateRange[0], dateRange[1]);
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      setDateRange([
        dates[0].format('YYYY-MM-DD'),
        dates[1].format('YYYY-MM-DD'),
      ]);
    }
  };

  const columns: ColumnsType<ParkingLotStatistics> = [
    {
      title: '停车场',
      dataIndex: 'lot_name',
      key: 'lot_name',
    },
    {
      title: '总车流量',
      dataIndex: 'total_vehicles',
      key: 'total_vehicles',
      sorter: (a, b) => a.total_vehicles - b.total_vehicles,
    },
    {
      title: '总收入(元)',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (value: number) => `¥${value.toFixed(2)}`,
      sorter: (a, b) => a.total_revenue - b.total_revenue,
    },
    {
      title: '当前占用',
      dataIndex: 'current_occupancy',
      key: 'current_occupancy',
    },
    {
      title: '占用率',
      dataIndex: 'occupancy_rate',
      key: 'occupancy_rate',
      render: (value: number) => (
        <Progress
          percent={Math.round(value * 100)}
          size="small"
          status={value > 0.9 ? 'exception' : 'normal'}
        />
      ),
      sorter: (a, b) => a.occupancy_rate - b.occupancy_rate,
    },
  ];

  const hourlyData = statistics.hourly_distribution
    ? Object.entries(statistics.hourly_distribution).map(([hour, count]) => ({
        hour: `${hour}:00`,
        count,
      }))
    : [];

  const generatePDF = async () => {
    if (!contentRef.current) return;

    try {
      setLoading(true);

      // 等待图表加载完成
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 创建一个临时div用于生成PDF内容
      const printContent = document.createElement('div');
      printContent.style.padding = '20px';
      printContent.style.background = 'white';
      printContent.style.width = '1200px';
      
      // 添加标题
      const title = document.createElement('h1');
      title.style.textAlign = 'center';
      title.style.marginBottom = '20px';
      title.style.fontFamily = 'Arial, "Microsoft YaHei", sans-serif';
      title.innerText = '停车场统计报表';
      printContent.appendChild(title);

      // 添加日期范围
      const dateInfo = document.createElement('p');
      dateInfo.style.marginBottom = '20px';
      dateInfo.style.fontFamily = 'Arial, "Microsoft YaHei", sans-serif';
      dateInfo.innerText = `统计时间：${dateRange[0]} 至 ${dateRange[1]}`;
      printContent.appendChild(dateInfo);

      // 创建统计数据表格
      const statsTable = document.createElement('table');
      statsTable.style.width = '100%';
      statsTable.style.marginBottom = '30px';
      statsTable.style.borderCollapse = 'collapse';
      statsTable.style.fontFamily = 'Arial, "Microsoft YaHei", sans-serif';

      // 添加统计数据
      const statsData = [
        ['总车流量', `${statistics.total_vehicles} 辆`],
        ['总收入', `¥${statistics.total_revenue.toFixed(2)}`],
        ['平均停车时长', `${statistics.average_duration.toFixed(1)} 小时`],
        ['当前在场车辆', `${statistics.current_occupancy} 辆`],
      ];

      statsData.forEach(([label, value]) => {
        const row = statsTable.insertRow();
        const cell1 = row.insertCell();
        const cell2 = row.insertCell();
        
        cell1.style.border = '1px solid #ddd';
        cell1.style.padding = '8px';
        cell1.style.backgroundColor = '#f5f5f5';
        cell1.innerText = label;

        cell2.style.border = '1px solid #ddd';
        cell2.style.padding = '8px';
        cell2.innerText = value;
      });

      printContent.appendChild(statsTable);

      // 添加停车场统计表格
      const parkingTable = document.createElement('table');
      parkingTable.style.width = '100%';
      parkingTable.style.marginBottom = '30px';
      parkingTable.style.borderCollapse = 'collapse';
      parkingTable.style.fontFamily = 'Arial, "Microsoft YaHei", sans-serif';

      // 添加表头
      const headerRow = parkingTable.insertRow();
      ['停车场', '总车流量', '总收入', '当前占用', '占用率'].forEach(text => {
        const th = document.createElement('th');
        th.style.border = '1px solid #ddd';
        th.style.padding = '8px';
        th.style.backgroundColor = '#f5f5f5';
        th.innerText = text;
        headerRow.appendChild(th);
      });

      // 添加停车场数据
      statistics.lot_statistics.forEach(lot => {
        const row = parkingTable.insertRow();
        [
          lot.lot_name,
          lot.total_vehicles.toString(),
          `¥${lot.total_revenue.toFixed(2)}`,
          lot.current_occupancy.toString(),
          `${(lot.occupancy_rate * 100).toFixed(1)}%`,
        ].forEach(text => {
          const cell = row.insertCell();
          cell.style.border = '1px solid #ddd';
          cell.style.padding = '8px';
          cell.innerText = text;
        });
      });

      printContent.appendChild(parkingTable);

      // 添加图表说明
      const chartNote = document.createElement('p');
      chartNote.style.marginTop = '20px';
      chartNote.style.fontStyle = 'italic';
      chartNote.style.color = '#666';
      chartNote.style.fontFamily = 'Arial, "Microsoft YaHei", sans-serif';
      chartNote.innerText = '注：24小时车流量分布图表可在系统界面查看';
      printContent.appendChild(chartNote);

      // 将内容添加到文档中以便截图
      document.body.appendChild(printContent);

      // 使用html2canvas将内容转换为图片
      const canvas = await html2canvas(printContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 1200,
        height: printContent.offsetHeight,
      } as any);

      // 移除临时内容
      document.body.removeChild(printContent);

      // 创建PDF
      const imgWidth = 210; // A4 宽度 (mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // 如果内容超过一页，需要分页处理
      let position = 0;
      const pageHeight = 295; // A4高度
      
      while (position < imgHeight) {
        if (position > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        position += pageHeight;
      }

      // 生成文件名
      const fileName = `停车场统计报表_${dateRange[0]}_${dateRange[1]}.pdf`;
      
      // 保存PDF
      pdf.save(fileName);
      message.success('报表导出成功！');
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error('报表生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="statistics-container" ref={contentRef}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card className="statistics-card">
          <Row justify="space-between" className="statistics-header">
            <Col>
              <RangePicker
                value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
                onChange={handleDateRangeChange}
              />
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<FileOutlined />}
                  onClick={generatePDF}
                  loading={loading}
                >
                  导出报表
                </Button>
              </Space>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="statistics-cards-row">
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title="总车流量"
                  value={statistics.total_vehicles}
                  prefix={<CarOutlined />}
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title="总收入"
                  value={statistics.total_revenue}
                  precision={2}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title="平均停车时长"
                  value={statistics.average_duration}
                  precision={1}
                  prefix={<ClockCircleOutlined />}
                  suffix="小时"
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic
                  title="当前在场车辆"
                  value={statistics.current_occupancy}
                  prefix={<BarChartOutlined />}
                  loading={loading}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        <Card title="停车场统计" className="statistics-table-card">
          <Table
            columns={columns}
            dataSource={statistics.lot_statistics}
            rowKey="lot_id"
            loading={loading}
            pagination={false}
            className="statistics-table"
          />
        </Card>

        <Card title="24小时车流量分布" className="statistics-chart-card">
          {hourlyData.length > 0 ? (
            <Line
              data={hourlyData}
              loading={loading}
              xField="hour"
              yField="count"
              xAxis={{
                title: { text: '时间' },
              }}
              yAxis={{
                title: { text: '车辆数' },
              }}
              smooth
              point={{
                size: 3,
                shape: 'circle',
              }}
              color={['#1890FF']}
            />
          ) : (
            <Empty description="暂无数据" />
          )}
        </Card>
      </Space>
    </div>
  );
};

export default Statistics;