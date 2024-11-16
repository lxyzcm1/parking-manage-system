import { Layout, Menu } from 'antd';
import { Link, Outlet } from 'react-router-dom';
import {
  CarOutlined,
  SettingOutlined,
  DashboardOutlined,
  PrinterOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ padding: 0, background: '#fff' }}>
        <div style={{ float: 'left', width: 200, textAlign: 'center' }}>
          <h2>停车场管理系统</h2>
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['1']}
            style={{ height: '100%', borderRight: 0 }}
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
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', padding: 24, margin: 0, minHeight: 280 }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;