import { Layout, Menu } from 'antd';
import { Link, Outlet } from 'react-router-dom';
import {
  CarOutlined,
  SettingOutlined,
  DashboardOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import './Layout.css';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  return (
    <Layout className="main-layout">
      <Header className="header">
        <div className="logo-container">
          <h2>停车场管理系统</h2>
        </div>
      </Header>
      <Layout>
        <Sider className="sider" width={200}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            className="menu"
          >
            <Menu.Item key="1" icon={<CarOutlined />}>
              <Link to="/parking">车辆进出</Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<SettingOutlined />}>
              <Link to="/settings">系统设置</Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<DashboardOutlined />}>
              <Link to="/statistics">统计报表</Link>
            </Menu.Item>
            <Menu.Item key="4" icon={<PrinterOutlined />}>
              <Link to="/records">收费记录</Link>
            </Menu.Item>
          </Menu>
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