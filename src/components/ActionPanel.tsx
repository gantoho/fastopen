import React, { useState } from 'react';
import { Card, Button, Space, Statistic, Row, Col, Tooltip, Divider, Select, Checkbox, message } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, GlobalOutlined } from '@ant-design/icons';
import { useApp } from '../stores/AppContext';
import { useOpenWebsites } from '../hooks/useOpenWebsites';

const { Option } = Select;

export const ActionPanel: React.FC = () => {
  const { state } = useApp();
  const { openAll, isOpening } = useOpenWebsites();
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  const enabledWebsites = state.websites.filter(w => w.enabled);
  const selectedPreset = state.selectedPresetId
    ? state.subPathPresets.find(p => p.id === state.selectedPresetId)
    : null;

  const totalUrlsToOpen = selectedPreset
    ? enabledWebsites.length * selectedPreset.paths.length
    : enabledWebsites.length;

  const handleSelectPath = (paths: string[]) => {
    setSelectedPaths(paths);
  };

  const handleSelectAllPaths = (e: any) => {
    if (selectedPreset) {
      if (e.target.checked) {
        setSelectedPaths([...selectedPreset.paths]);
      } else {
        setSelectedPaths([]);
      }
    }
  };

  const handleOpenAll = () => {
    if (enabledWebsites.length === 0) {
      message.warning('请先启用至少一个网站');
      return;
    }
    
    if (selectedPreset && selectedPaths.length > 0) {
      // 打开选定的子路径
      openAll(selectedPaths);
    } else {
      // 打开所有子路径
      openAll();
    }
  };

  return (
    <Card>
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="网站总数"
            value={state.websites.length}
            prefix={<GlobalOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="已启用"
            value={enabledWebsites.length}
            prefix={<CheckCircleOutlined />}
            styles={{ content: { color: '#3f8600' } }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="子路径预设"
            value={state.subPathPresets.length}
            prefix={<GlobalOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="即将打开"
            value={totalUrlsToOpen}
            prefix={<PlayCircleOutlined />}
            styles={{ content: { color: totalUrlsToOpen > 0 ? '#1890ff' : undefined } }}
          />
        </Col>
      </Row>

      <Divider titlePlacement="left">操作</Divider>

      {selectedPreset && (
        <div style={{ marginBottom: 16, padding: 12, border: '1px solid var(--ant-color-border)', borderRadius: 8, background: 'var(--ant-color-bg-2)' }}>
          <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
            子路径选择器 (当前预设: {selectedPreset.name})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <Checkbox
              onChange={handleSelectAllPaths}
              checked={selectedPreset.paths.length > 0 && selectedPaths.length === selectedPreset.paths.length}
            >
              全选
            </Checkbox>
            <Select
              mode="multiple"
              placeholder="选择要打开的子路径"
              value={selectedPaths}
              onChange={handleSelectPath}
              style={{ flex: 1 }}
            >
              {selectedPreset.paths.map((path, index) => (
                <Option key={index} value={path}>{path}</Option>
              ))}
            </Select>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
            {selectedPaths.length > 0 
              ? `将打开 ${enabledWebsites.length} 个网站的 ${selectedPaths.length} 个选中子路径`
              : '未选择子路径，将打开所有子路径'}
          </div>
        </div>
      )}

      <Space wrap size="middle">
        <Tooltip title="打开所有已启用的网站">
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={handleOpenAll}
            disabled={enabledWebsites.length === 0 || isOpening}
            loading={isOpening}
          >
            全部打开
          </Button>
        </Tooltip>

        {selectedPreset && (
          <Tooltip title={`当前使用预设: ${selectedPreset.name}`}>
            <Button size="large" disabled>
              预设: {selectedPreset.name}
            </Button>
          </Tooltip>
        )}
      </Space>
    </Card>
  );
};
