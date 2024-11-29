import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const LoginWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
`;

const LoginCard = styled(Card)`
  width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: LoginForm) => {
    setLoading(true);
    try {
      // 模拟用户数据，实际项目中应该从后端获取
      const users = {
        'operator': {
          password: 'operator123',
          role: 'operator'
        },
        'admin': {
          password: 'admin123',
          role: 'admin'
        }
      };

      const user = users[values.username as keyof typeof users];
      
      if (user && user.password === values.password) {
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('username', values.username);
        message.success('登录成功');
        navigate('/');
      } else {
        message.error('用户名或密码错误');
      }
    } catch (error) {
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginWrapper>
      <LoginCard title="停车场管理系统登录">
        <Form
          name="login"
          onFinish={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <p>测试账号：</p>
            <p>收费员 - operator / operator123</p>
            <p>管理员 - admin / admin123</p>
          </div>
        </Form>
      </LoginCard>
    </LoginWrapper>
  );
};

export default Login;
