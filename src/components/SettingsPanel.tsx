import React from 'react';
import { Card, Form, Switch, Select, Divider, Button, Space, Popconfirm, message, InputNumber } from 'antd';
import { SunOutlined, MoonOutlined, GlobalOutlined, ClearOutlined } from '@ant-design/icons';
import { useApp } from '../stores/AppContext';
import { useTheme } from '../hooks/useTheme';
import { clearStorage } from '../utils/storage';

const { Option } = Select;

export const SettingsPanel: React.FC = () => {
  const { state, dispatch } = useApp();
  const { setTheme } = useTheme();

  const handleReset = () => {
    dispatch({ type: 'RESET_STATE' });
    clearStorage();
    message.success('已重置所有设置和数据');
  };

  return (
    <Card title="设置">
      <Form layout="vertical">
        <Divider titlePlacement="left">主题设置</Divider>
        
        <Form.Item label="主题模式">
          <Select
            value={state.settings.theme}
            onChange={(value) => setTheme(value as 'light' | 'dark' | 'auto')}
            style={{ width: 200 }}
          >
            <Option value="light">
              <Space>
                <SunOutlined /> 浅色模式
              </Space>
            </Option>
            <Option value="dark">
              <Space>
                <MoonOutlined /> 深色模式
              </Space>
            </Option>
            <Option value="auto">
              <Space>
                <GlobalOutlined /> 跟随系统
              </Space>
            </Option>
          </Select>
        </Form.Item>

        <Divider titlePlacement="left">打开设置</Divider>

        <Form.Item label="打开延迟">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <InputNumber
              min={100}
              max={10000}
              step={100}
              value={state.settings.openDelay}
              onChange={(value) => dispatch({ type: 'UPDATE_SETTINGS', payload: { openDelay: value || 1000 } })}
              style={{ width: 120 }}
            />
            <span style={{ color: 'var(--ant-color-text-secondary)' }}>ms (每个网站之间的间隔时间)</span>
          </div>
        </Form.Item>

        <Form.Item
          label="新标签页打开"
          valuePropName="checked"
          help="在新标签页中打开网站"
        >
          <Switch
            checked={state.settings.openInNewTab}
            onChange={(checked) => dispatch({ type: 'UPDATE_SETTINGS', payload: { openInNewTab: checked } })}
          />
        </Form.Item>

        <Divider titlePlacement="left">数据设置</Divider>

        <Form.Item
          label="自动保存"
          valuePropName="checked"
          help="自动保存所有更改到本地存储"
        >
          <Switch
            checked={state.settings.autoSave}
            onChange={(checked) => dispatch({ type: 'UPDATE_SETTINGS', payload: { autoSave: checked } })}
          />
        </Form.Item>

        <Divider titlePlacement="left">数据管理</Divider>

        <Form.Item>
          <Popconfirm
            title="确定要重置所有数据吗？"
            description="这将删除所有网站、预设和设置，此操作不可撤销！"
            onConfirm={handleReset}
            okText="确定重置"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<ClearOutlined />}>
              重置所有数据
            </Button>
          </Popconfirm>
        </Form.Item>
      </Form>
    </Card>
  );
};
