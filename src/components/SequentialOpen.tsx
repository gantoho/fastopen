import React, { useState } from 'react';
import { Card, Button, Space, InputNumber, List, Switch as AntSwitch, Popconfirm, Tooltip, Empty, message, Divider, Row, Col, Statistic, Select, Checkbox } from 'antd';
import { PlayCircleOutlined, ThunderboltOutlined, CheckCircleOutlined, GlobalOutlined, LinkOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useApp, Website } from '../stores/AppContext';
import { useOpenWebsites } from '../hooks/useOpenWebsites';
import { extractDomain } from '../utils/url';

const { Option } = Select;

interface WebsiteItemProps {
  website: Website;
  onEdit: (website: Website) => void;
}

const WebsiteItem: React.FC<WebsiteItemProps> = ({ website, onEdit }) => {
  const { dispatch } = useApp();
  const { openSingle } = useOpenWebsites();

  return (
    <List.Item
      actions={[
        <Tooltip title="打开" key="open">
          <Button
            type="link"
            icon={<LinkOutlined />}
            onClick={() => openSingle(website.id)}
          />
        </Tooltip>,
        <Tooltip title="编辑" key="edit">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(website)}
          />
        </Tooltip>,
        <Popconfirm
          key="delete"
          title="确定要删除这个网站吗？"
          onConfirm={() => dispatch({ type: 'DELETE_WEBSITE', payload: website.id })}
          okText="确定"
          cancelText="取消"
        >
          <Tooltip title="删除">
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>,
      ]}
    >
      <List.Item.Meta
        avatar={<GlobalOutlined style={{ fontSize: 24 }} />}
        title={
          <Space>
            <AntSwitch
              checked={website.enabled}
              onChange={() => dispatch({ type: 'TOGGLE_WEBSITE', payload: website.id })}
            />
            <span style={{ opacity: website.enabled ? 1 : 0.5 }}>{website.name}</span>
          </Space>
        }
        description={
          <a
            href={website.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit' }}
          >
            {extractDomain(website.url)}
          </a>
        }
      />
    </List.Item>
  );
};

interface SequentialOpenProps {
  onEditWebsite: (website: Website) => void;
}

export const SequentialOpen: React.FC<SequentialOpenProps> = ({ onEditWebsite }) => {
  const { state, dispatch } = useApp();
  const { openBatch, isOpening } = useOpenWebsites();
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  const enabledWebsites = state.websites.filter(w => w.enabled);
  const selectedPreset = state.selectedPresetId
    ? state.subPathPresets.find(p => p.id === state.selectedPresetId)
    : null;

  const totalUrlsToOpen = selectedPreset
    ? enabledWebsites.length * selectedPreset.paths.length
    : enabledWebsites.length;

  const filteredWebsites = state.websites;

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

  const handleOpenSequential = () => {
    if (enabledWebsites.length === 0) {
      message.warning('请先启用至少一个网站');
      return;
    }
    
    if (selectedPreset && selectedPaths.length > 0) {
      // 打开选定的子路径
      openBatch(selectedPaths);
    } else {
      // 打开所有子路径
      openBatch();
    }
  };

  return (
    <>
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
              title="每次打开"
              value={state.settings.batchSize}
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="即将打开"
              value={Math.min(state.settings.batchSize, totalUrlsToOpen)}
              prefix={<PlayCircleOutlined />}
              styles={{ content: { color: '#1890ff' } }}
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

        <Space wrap size="middle" style={{ marginBottom: 16 }}>
          <Tooltip title={`逐个打开 ${state.settings.batchSize} 个网站`}>
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={handleOpenSequential}
              disabled={enabledWebsites.length === 0 || isOpening}
              loading={isOpening}
            >
              逐个打开
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

      <div style={{ height: 16 }} />

      <Card title="逐个打开配置">
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 120 }}>每次打开数量：</span>
            <InputNumber
              min={1}
              max={50}
              value={state.settings.batchSize}
              onChange={(value) => dispatch({ type: 'UPDATE_SETTINGS', payload: { batchSize: value || 5 } })}
              style={{ width: 120 }}
            />
            <span style={{ color: 'var(--ant-color-text-secondary)' }}>个网站</span>
          </div>
        </Space>
      </Card>

      <div style={{ height: 16 }} />

      <Card
        title="网站列表"
        extra={
          <Space>
            <Button
              onClick={() => {
                state.websites.forEach(w => {
                  if (!w.enabled) {
                    dispatch({ type: 'TOGGLE_WEBSITE', payload: w.id });
                  }
                });
              }}
            >
              全选
            </Button>
            <Button
              onClick={() => {
                state.websites.forEach(w => {
                  if (w.enabled) {
                    dispatch({ type: 'TOGGLE_WEBSITE', payload: w.id });
                  }
                });
              }}
            >
              全不选
            </Button>
          </Space>
        }
      >
        {filteredWebsites.length === 0 ? (
          <Empty description="还没有添加网站" />
        ) : (
          <List
            dataSource={filteredWebsites}
            renderItem={(website) => (
              <WebsiteItem
                key={website.id}
                website={website}
                onEdit={onEditWebsite}
              />
            )}
          />
        )}
      </Card>
    </>
  );
};
