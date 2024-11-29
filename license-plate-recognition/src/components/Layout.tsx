import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  ImportOutlined,
  ExportOutlined,
  HistoryOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import './Layout.css';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = localStorage.getItem('userRole');

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    navigate('/login', { replace: true });
  };

  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/entry',
        icon: <ImportOutlined />,
        label: '车辆入场'
      },
      {
        key: '/exit',
        icon: <ExportOutlined />,
        label: '车辆出场'
      },
      {
        key: '/records',
        icon: <HistoryOutlined />,
        label: '停车记录'
      }
    ];

    const adminItems = [
      {
        key: '/statistics',
        icon: <BarChartOutlined />,
        label: '统计分析'
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: '系统设置'
      }
    ];

    return userRole === 'admin' ? [...baseItems, ...adminItems] : baseItems;
  };

  return (
    <Layout className="main-layout">
      <Header className="header">
        <div className="logo-container">
          <h2>停车场管理系统</h2>
        </div>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{ color: 'white' }}
        >
          退出登录
        </Button>
      </Header>
      <Layout>
        <Sider className="sider" width={200}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={getMenuItems()}
            onClick={({ key }) => navigate(key)}
            className="menu"
          />
        </Sider>
        <Layout className="content-layout">
          <Content className="content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;