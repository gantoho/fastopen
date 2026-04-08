import { useState, useEffect } from 'react';
import { ConfigProvider, Layout, Tabs, theme } from 'antd';
import { FileOutlined, SettingOutlined, LinkOutlined, BulbOutlined } from '@ant-design/icons';
import { AppProvider, useApp } from './stores/AppContext';
import { ActionPanel } from './components/ActionPanel';
import { WebsiteList } from './components/WebsiteList';
import { SettingsPanel } from './components/SettingsPanel';
import { SubPathPresetManager } from './components/SubPathPresetManager';
import { SequentialOpen } from './components/SequentialOpen';
import { useTheme } from './hooks/useTheme';
import './App.css';

const { Header, Content, Footer } = Layout;
const { darkAlgorithm, defaultAlgorithm } = theme;

function AppContent() {
  useTheme(); // 确保调用useTheme钩子
  const { state } = useApp();
  const [, setEditWebsite] = useState<any>(null);

  // 确定当前主题模式
  const getCurrentTheme = () => {
    if (state.settings.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return state.settings.theme;
  };

  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

  useEffect(() => {
    setCurrentTheme(getCurrentTheme());
  }, [state.settings.theme]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (state.settings.theme === 'auto') {
        setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [state.settings.theme]);

  const tabItems = [
    {
      key: 'all',
      label: '全部打开',
      icon: <FileOutlined />,
      children: (
        <>
          <ActionPanel />
          <div style={{ height: 16 }} />
          <WebsiteList onEditWebsite={setEditWebsite} />
        </>
      ),
    },
    {
      key: 'sequential',
      label: '逐个打开',
      icon: <LinkOutlined />,
      children: <SequentialOpen onEditWebsite={setEditWebsite} />,
    },
    {
      key: 'presets',
      label: '子路径预设',
      icon: <BulbOutlined />,
      children: <SubPathPresetManager />,
    },
    {
      key: 'settings',
      label: '设置',
      icon: <SettingOutlined />,
      children: <SettingsPanel />,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? darkAlgorithm : defaultAlgorithm,
      }}
    >
      <Layout className="app-layout">
        <Header className="app-header">
          <div className="header-content">
            <h1 style={{ color: 'white', margin: 0, fontSize: 20 }}>⚡FastOpen</h1>
          </div>
        </Header>
        
        <Content className="app-content">
          <div className="content-wrapper">
            <Tabs
              type="card"
              size="large"
              style={{ marginBottom: 24 }}
              items={tabItems}
            />
          </div>
        </Content>
        
        <Footer className="app-footer">
          FastOpen ©{new Date().getFullYear()} - 快速批量打开网站工具
        </Footer>
      </Layout>
    </ConfigProvider>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
