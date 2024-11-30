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
import { Line as AntLine, Column as AntColumn, Pie as AntPie } from '@ant-design/plots';
import { Line, Column, Pie } from '@antv/g2plot';
import type { ColumnOptions, PieOptions, LineOptions } from '@antv/g2plot';
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
    let containerDiv: HTMLDivElement | null = null;
    let printContent: HTMLDivElement | null = null;
    let chart: Line | null = null;
    let columnChart: Column | null = null;
    let pieChart: Pie | null = null;

    try {
      setLoading(true);
      message.loading({ content: '正在生成PDF...', key: 'pdfGeneration' });

      // 创建打印容器
      printContent = document.createElement('div');
      printContent.style.padding = '20px';
      printContent.style.backgroundColor = '#ffffff';
      printContent.style.width = '1000px';

      // 添加标题
      const title = document.createElement('h1');
      title.style.textAlign = 'center';
      title.style.marginBottom = '30px';
      title.style.fontSize = '24px';
      title.style.color = '#1890ff';
      title.textContent = `停车场统计报表 (${dateRange[0]} 至 ${dateRange[1]})`;
      printContent.appendChild(title);

      // 添加总体统计信息
      const summaryContainer = document.createElement('div');
      summaryContainer.style.marginBottom = '30px';
      summaryContainer.style.padding = '20px';
      summaryContainer.style.backgroundColor = '#f5f5f5';
      summaryContainer.style.borderRadius = '4px';
      summaryContainer.innerHTML = `
        <div style="display: flex; justify-content: space-around; text-align: center;">
          <div>
            <h3 style="margin: 0; color: #666;">总车流量</h3>
            <p style="font-size: 24px; margin: 10px 0; color: #1890ff;">${statistics.total_vehicles}</p>
          </div>
          <div>
            <h3 style="margin: 0; color: #666;">总收入</h3>
            <p style="font-size: 24px; margin: 10px 0; color: #1890ff;">¥${statistics.total_revenue.toFixed(2)}</p>
          </div>
          <div>
            <h3 style="margin: 0; color: #666;">平均停车时长</h3>
            <p style="font-size: 24px; margin: 10px 0; color: #1890ff;">${statistics.average_duration.toFixed(1)}小时</p>
          </div>
        </div>
      `;
      printContent.appendChild(summaryContainer);

      // 渲染图表
      if (hourlyData.length > 0) {
        // 添加图表标题
        const chartTitle = document.createElement('h2');
        chartTitle.style.marginBottom = '20px';
        chartTitle.style.fontSize = '18px';
        chartTitle.textContent = '24小时车流量趋势';
        printContent.appendChild(chartTitle);

        // 创建图表容器
        const chartWrapper = document.createElement('div');
        chartWrapper.style.width = '100%';
        chartWrapper.style.height = '300px';
        chartWrapper.style.marginBottom = '40px';
        chartWrapper.style.backgroundColor = '#ffffff';
        chartWrapper.style.borderRadius = '4px';
        chartWrapper.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        chartWrapper.style.padding = '20px';
        printContent.appendChild(chartWrapper);

        const chartConfig: LineOptions = {
          data: hourlyData,
          xField: 'hour',
          yField: 'count',
          xAxis: {
            title: { text: '时间' },
          },
          yAxis: {
            title: { text: '车辆数' },
          },
          smooth: true,
          point: {
            size: 3,
            shape: 'circle',
          },
          color: '#1890FF',
          animation: false,
        };

        chart = new Line(chartWrapper, chartConfig);
        await chart.render();

        // 等待图表渲染完成
        await new Promise(resolve => setTimeout(resolve, 500));

        // 添加柱状图标题
        const columnTitle = document.createElement('h2');
        columnTitle.style.marginBottom = '20px';
        columnTitle.style.fontSize = '18px';
        columnTitle.textContent = '停车场车流量分布';
        printContent.appendChild(columnTitle);

        // 渲染柱状图
        const columnContainer = document.createElement('div');
        columnContainer.style.width = '100%';
        columnContainer.style.height = '300px';
        columnContainer.style.marginBottom = '40px';
        columnContainer.style.backgroundColor = '#ffffff';
        columnContainer.style.borderRadius = '4px';
        columnContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        columnContainer.style.padding = '20px';
        printContent.appendChild(columnContainer);

        const columnChartConfig: ColumnOptions = {
          data: statistics.lot_statistics.map(lot => ({
            停车场: lot.lot_name,
            车流量: lot.total_vehicles
          })),
          xField: '停车场',
          yField: '车流量',
          label: {
            position: 'top',
            style: {
              fill: '#1890ff',
            },
          },
          xAxis: {
            label: {
              autoRotate: true,
              autoHide: false,
              autoEllipsis: true,
            },
          },
          animation: false,
        };

        columnChart = new Column(columnContainer, columnChartConfig);
        await columnChart.render();

        // 添加饼图标题
        const pieTitle = document.createElement('h2');
        pieTitle.style.marginBottom = '20px';
        pieTitle.style.fontSize = '18px';
        pieTitle.textContent = '停车场收入分布';
        printContent.appendChild(pieTitle);

        // 渲染饼图
        const pieContainer = document.createElement('div');
        pieContainer.style.width = '100%';
        pieContainer.style.height = '300px';
        pieContainer.style.marginBottom = '40px';
        pieContainer.style.backgroundColor = '#ffffff';
        pieContainer.style.borderRadius = '4px';
        pieContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        pieContainer.style.padding = '20px';
        printContent.appendChild(pieContainer);

        const pieChartConfig: PieOptions = {
          data: statistics.lot_statistics.map(lot => ({
            type: lot.lot_name,
            value: lot.total_revenue
          })),
          angleField: 'value',
          colorField: 'type',
          radius: 0.75,
          label: {
            type: 'inner',
            offset: '-30%',
            content: '{percentage}',
            style: {
              fontSize: 14,
              textAlign: 'center',
            },
          },
          interactions: [
            {
              type: 'element-active',
            },
          ],
          legend: {
            layout: 'horizontal',
            position: 'bottom'
          },
          animation: false,
        };

        pieChart = new Pie(pieContainer, pieChartConfig);
        await pieChart.render();

        // 等待所有图表渲染完成
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 将内容添加到文档中以便截图
      containerDiv = document.createElement('div');
      containerDiv.style.position = 'absolute';
      containerDiv.style.left = '-9999px';
      containerDiv.style.top = '0';
      containerDiv.appendChild(printContent);
      document.body.appendChild(containerDiv);

      // 等待所有图表完全渲染
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 使用html2canvas将内容转换为图片
      const canvas = await html2canvas(printContent, {
        backgroundColor: '#ffffff',
        width: printContent.offsetWidth,
        height: printContent.offsetHeight,
        logging: false,
        useCORS: true,
        scale: 2,
        onclone: (clonedDoc: Document) => {
          const clonedContent = clonedDoc.querySelector('div') as HTMLElement;
          if (clonedContent) {
            clonedContent.style.transform = 'scale(1)';
          }
        }
      } as any);

      // 创建PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // 页边距，单位是毫米

      // 计算图片在PDF中的尺寸
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 如果内容超过一页，需要分页处理
      let heightLeft = imgHeight;
      let position = 0;

      // 添加第一页
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        margin,
        margin,
        imgWidth,
        imgHeight
      );

      // 如果内容超过一页，添加新页面
      while (heightLeft >= pageHeight) {
        position = heightLeft - pageHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/jpeg', 1.0),
          'JPEG',
          margin,
          margin - position,
          imgWidth,
          imgHeight
        );
        heightLeft -= pageHeight;
      }

      // 生成文件名
      const fileName = `停车场统计报表_${dateRange[0]}_${dateRange[1]}.pdf`;
      pdf.save(fileName);

      message.success({ content: 'PDF生成成功', key: 'pdfGeneration' });
    } catch (error) {
      console.error('PDF生成失败:', error);
      message.error({ content: 'PDF生成失败', key: 'pdfGeneration' });
    } finally {
      // 销毁图表实例
      if (chart) chart.destroy();
      if (columnChart) columnChart.destroy();
      if (pieChart) pieChart.destroy();

      // 移除临时内容
      if (containerDiv && document.body.contains(containerDiv)) {
        document.body.removeChild(containerDiv);
      }
      
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

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="各停车场车流量统计" className="statistics-chart-card">
              {statistics.lot_statistics.length > 0 ? (
                <AntColumn
                  data={statistics.lot_statistics.map(lot => ({
                    停车场: lot.lot_name,
                    车流量: lot.total_vehicles
                  }))}
                  loading={false}
                  xField="停车场"
                  yField="车流量"
                  label={{
                    position: 'top' as const,
                    style: {
                      fill: '#1890ff',
                    },
                  }}
                  xAxis={{
                    label: {
                      autoRotate: true,
                      autoHide: false,
                      autoEllipsis: true,
                    },
                  }}
                  theme={{
                    loading: {
                      shadowRoot: false
                    }
                  }}
                />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
          <Col span={12}>
            <Card title="各停车场收入占比" className="statistics-chart-card">
              {statistics.lot_statistics.length > 0 ? (
                <AntPie
                  data={statistics.lot_statistics.map(lot => ({
                    type: lot.lot_name,
                    value: lot.total_revenue
                  }))}
                  loading={false}
                  angleField="value"
                  colorField="type"
                  radius={0.8}
                  label={{
                    type: 'outer' as const,
                    content: '{name} {percentage}',
                  }}
                  legend={{
                    layout: 'horizontal' as const,
                    position: 'bottom' as const
                  }}
                  theme={{
                    loading: {
                      shadowRoot: false
                    }
                  }}
                />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
        </Row>

        <Card title="24小时车流量分布" className="statistics-chart-card">
          {hourlyData.length > 0 ? (
            <AntLine
              data={hourlyData}
              loading={false}
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
              theme={{
                loading: {
                  shadowRoot: false
                }
              }}
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