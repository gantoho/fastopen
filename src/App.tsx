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
const { TabPane } = Tabs;
const { darkAlgorithm, defaultAlgorithm } = theme;

function AppContent() {
  useTheme(); // 确保调用useTheme钩子
  const { state, dispatch } = useApp();
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

  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? darkAlgorithm : defaultAlgorithm,
      }}
    >
      <Layout className="app-layout">
        <Header className="app-header">
          <div className="header-content">
            <h1 style={{ color: 'white', margin: 0, fontSize: 20, marginRight: 24 }}>⚡FastOpen</h1>
            <Tabs
              type="card"
              size="small"
              style={{ flex: 1 }}
              className="header-tabs"
              activeKey={state.activeTab}
              onChange={(key) => dispatch({ type: 'SET_ACTIVE_TAB', payload: key })}
            >
              <TabPane tab="全部打开" key="all" icon={<FileOutlined />} />
              <TabPane tab="逐个打开" key="sequential" icon={<LinkOutlined />} />
              <TabPane tab="子路径预设" key="presets" icon={<BulbOutlined />} />
              <TabPane tab="设置" key="settings" icon={<SettingOutlined />} />
            </Tabs>
          </div>
        </Header>
        
        <Content className="app-content">
          <div className="content-wrapper">
            {state.activeTab === 'all' && (
              <>
                <ActionPanel />
                <div style={{ height: 16 }} />
                <WebsiteList onEditWebsite={setEditWebsite} />
              </>
            )}
            {state.activeTab === 'sequential' && (
              <SequentialOpen onEditWebsite={setEditWebsite} />
            )}
            {state.activeTab === 'presets' && (
              <SubPathPresetManager />
            )}
            {state.activeTab === 'settings' && (
              <SettingsPanel />
            )}
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
