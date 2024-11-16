import { Card, Form, InputNumber, Button, message } from 'antd';
import { useState } from 'react';

interface FeeSettings {
  hourlyRate: number;
  dailyMaxRate: number;
  monthlyRate: number;
}

const Settings = () => {
  const [form] = Form.useForm<FeeSettings>();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: FeeSettings) => {
    setLoading(true);
    try {
      // 这里应该调用后端API保存设置
      console.log('保存设置:', values);
      message.success('设置保存成功');
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="收费标准设置">
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          hourlyRate: 5,
          dailyMaxRate: 50,
          monthlyRate: 1000,
        }}
      >
        <Form.Item
          label="小时收费(元)"
          name="hourlyRate"
          rules={[{ required: true, message: '请输入小时收费标准' }]}
        >
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="每日封顶(元)"
          name="dailyMaxRate"
          rules={[{ required: true, message: '请输入每日封顶金额' }]}
        >
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="月卡费用(元)"
          name="monthlyRate"
          rules={[{ required: true, message: '请输入月卡费用' }]}
        >
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Settings;