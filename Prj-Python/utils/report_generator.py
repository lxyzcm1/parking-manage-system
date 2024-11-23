from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime
import os
from pathlib import Path

def generate_parking_report(data, start_date, end_date, output_dir="reports"):
    """生成停车场数据报表"""
    # 创建报表目录
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # 设置报表文件名
    filename = output_path / f"parking_report_{start_date}_{end_date}.pdf"
    
    # 创建PDF文档
    doc = SimpleDocTemplate(
        str(filename),
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # 获取样式
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    normal_style = styles['Normal']
    
    # 创建报表内容
    elements = []
    
    # 添加标题
    title = Paragraph(f"停车场数据报表 ({start_date} 至 {end_date})", title_style)
    elements.append(title)
    elements.append(Spacer(1, 20))
    
    # 添加统计摘要
    summary_data = [
        ["总计车辆数", str(data['total_vehicles'])],
        ["总收入", f"¥{data['total_revenue']:.2f}"],
        ["平均停车时长", f"{data['average_duration']:.2f}小时"]
    ]
    
    summary_table = Table(summary_data, colWidths=[200, 200])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 30))
    
    # 如果有详细记录，添加详细数据表格
    if 'records' in data:
        records_title = Paragraph("详细记录", styles['Heading2'])
        elements.append(records_title)
        elements.append(Spacer(1, 12))
        
        # 表头
        records_data = [['车牌号', '入场时间', '出场时间', '停车时长', '费用']]
        
        # 添加记录数据
        for record in data['records']:
            records_data.append([
                record['plate_number'],
                record['entry_time'].strftime('%Y-%m-%d %H:%M'),
                record['exit_time'].strftime('%Y-%m-%d %H:%M') if record['exit_time'] else '-',
                f"{record['duration']:.1f}小时" if record['duration'] else '-',
                f"¥{record['fee']:.2f}" if record['fee'] else '-'
            ])
        
        # 创建详细记录表格
        records_table = Table(records_data, colWidths=[100, 100, 100, 80, 80])
        records_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        elements.append(records_table)
    
    # 生成PDF
    doc.build(elements)
    
    return str(filename)

def generate_monthly_report(year, month, data, output_dir="reports"):
    """生成月度报表"""
    # 创建报表目录
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # 设置报表文件名
    filename = output_path / f"monthly_report_{year}_{month:02d}.pdf"
    
    # 创建PDF文档
    doc = SimpleDocTemplate(
        str(filename),
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # 获取样式
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    
    # 创建报表内容
    elements = []
    
    # 添加标题
    title = Paragraph(f"{year}年{month}月 停车场月度报表", title_style)
    elements.append(title)
    elements.append(Spacer(1, 20))
    
    # 添加月度统计数据
    monthly_data = [
        ["总停车次数", str(data['total_records'])],
        ["月度总收入", f"¥{data['total_revenue']:.2f}"],
        ["平均每日车流量", f"{data['avg_daily_vehicles']:.1f}"],
        ["平均停车时长", f"{data['avg_parking_duration']:.1f}小时"],
        ["高峰时段", data['peak_hours']],
    ]
    
    monthly_table = Table(monthly_data, colWidths=[200, 200])
    monthly_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(monthly_table)
    
    # 生成PDF
    doc.build(elements)
    
    return str(filename)
