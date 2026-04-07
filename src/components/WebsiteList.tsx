import React, { useState } from 'react';
import { List, Card, Switch, Button, Input, Space, Popconfirm, Tooltip, Empty, message } from 'antd';
import { EditOutlined, DeleteOutlined, GlobalOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { useApp } from '../stores/AppContext';
import { useOpenWebsites } from '../hooks/useOpenWebsites';
import { Website } from '../types';
import { extractDomain, normalizeUrl, isValidUrl } from '../utils/url';

const { TextArea } = Input;

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
            <Switch
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

interface WebsiteListProps {
  onEditWebsite: (website: Website) => void;
}

export const WebsiteList: React.FC<WebsiteListProps> = ({ onEditWebsite }) => {
  const { state, dispatch } = useApp();
  const [searchText, setSearchText] = useState('');
  const [inputText, setInputText] = useState('');

  const filteredWebsites = state.websites.filter(website =>
    website.name.toLowerCase().includes(searchText.toLowerCase()) ||
    website.url.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleBatchAdd = () => {
    const lines = inputText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (lines.length === 0) {
      message.warning('请输入网址');
      return;
    }

    let addedCount = 0;
    let duplicateCount = 0;

    lines.forEach(line => {
      const url = normalizeUrl(line);
      
      if (!isValidUrl(line)) {
        return;
      }

      const exists = state.websites.some(
        w => normalizeUrl(w.url) === url
      );

      if (exists) {
        duplicateCount++;
        return;
      }

      const name = extractDomain(url);
      
      dispatch({
        type: 'ADD_WEBSITE',
        payload: {
          name,
          url,
          enabled: true,
        },
      });
      addedCount++;
    });

    if (addedCount > 0) {
      message.success(`成功添加 ${addedCount} 个网站`);
      setInputText('');
    }
    
    if (duplicateCount > 0) {
      message.info(`${duplicateCount} 个网址已存在，已跳过`);
    }

    if (addedCount === 0 && duplicateCount === 0) {
      message.error('没有有效的网址可添加');
    }
  };

  return (
    <Card
      title="网站列表"
      extra={
        <Input.Search
          placeholder="搜索网站..."
          allowClear
          style={{ width: 200 }}
          onChange={(e) => setSearchText(e.target.value)}
        />
      }
    >
      <div style={{ marginBottom: 16 }}>
        <TextArea
          placeholder="输入网址，每行一个&#10;例如：&#10;github.com&#10;https://google.com&#10;stackoverflow.com"
          rows={4}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ marginBottom: 8 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleBatchAdd}
        >
          批量添加
        </Button>
      </div>

      {filteredWebsites.length === 0 ? (
        <Empty
          description={
            searchText ? '没有找到匹配的网站' : '还没有添加网站，请在上方输入网址'
          }
        />
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
  );
};
