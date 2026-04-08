import React, { useState, useEffect } from 'react';
import { List, Card, Switch, Button, Input, Space, Popconfirm, Tooltip, Empty, message, Select } from 'antd';
import { EditOutlined, DeleteOutlined, GlobalOutlined, LinkOutlined, PlusOutlined, SortAscendingOutlined, SortDescendingOutlined, MenuOutlined } from '@ant-design/icons';
import { useApp, Website } from '../stores/AppContext';
import { useOpenWebsites } from '../hooks/useOpenWebsites';
import { extractDomain, normalizeUrl, isValidUrl } from '../utils/url';
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { TextArea } = Input;
const { Option } = Select;

interface WebsiteItemProps {
  website: Website;
  onEdit: (website: Website) => void;
  selected: boolean;
  onSelect: (id: string) => void;
}

const WebsiteItem: React.FC<WebsiteItemProps> = ({ website, onEdit, selected, onSelect }) => {
  const { dispatch } = useApp();
  const { openSingle } = useOpenWebsites();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: website.id,
  });

  const style = {
    padding: '8px 0', 
    borderBottom: '1px solid var(--ant-color-border)', 
    margin: 0,
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <List.Item
      ref={setNodeRef}
      style={style}
      actions={[
        <Tooltip title="打开" key="open">
          <Button
            type="link"
            icon={<LinkOutlined />}
            onClick={() => openSingle(website.id)}
            size="small"
          />
        </Tooltip>,
        <Tooltip title="编辑" key="edit">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(website)}
            size="small"
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
            <Button type="link" danger icon={<DeleteOutlined />} size="small" />
          </Tooltip>
        </Popconfirm>,
      ]}
    >
      <Space size={8} style={{ marginRight: 8 }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(website.id)}
          style={{ marginTop: 4 }}
        />
        <button
          {...attributes}
          {...listeners}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'grab',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            marginRight: 8,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <MenuOutlined style={{ fontSize: 16, color: 'var(--ant-color-text-secondary)' }} />
        </button>
      </Space>
      <List.Item.Meta
        avatar={<GlobalOutlined style={{ fontSize: 20 }} />}
        title={
          <Space size={8} style={{ marginBottom: 0 }}>
            <Switch
              checked={website.enabled}
              onChange={() => dispatch({ type: 'TOGGLE_WEBSITE', payload: website.id })}
              size="small"
            />
            <a
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', fontSize: 14, opacity: website.enabled ? 1 : 0.5 }}
            >
              {website.name}
            </a>
          </Space>
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
  const [isMobile, setIsMobile] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'url' | 'none'>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初始化检测
    checkMobile();

    // 监听窗口大小变化
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 过滤和排序网站
  const filteredWebsites = React.useMemo(() => {
    let websites = state.websites.filter(website =>
      website.name.toLowerCase().includes(searchText.toLowerCase()) ||
      website.url.toLowerCase().includes(searchText.toLowerCase())
    );

    // 排序
    if (sortBy !== 'none') {
      websites = [...websites].sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (sortBy === 'url') {
          comparison = a.url.localeCompare(b.url);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return websites;
  }, [state.websites, searchText, sortBy, sortOrder]);

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

  // 选择/取消选择网站
  const handleSelectWebsite = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedIds.length === filteredWebsites.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredWebsites.map(website => website.id));
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      message.warning('请选择要删除的网站');
      return;
    }

    selectedIds.forEach(id => {
      dispatch({ type: 'DELETE_WEBSITE', payload: id });
    });

    message.success(`成功删除 ${selectedIds.length} 个网站`);
    setSelectedIds([]);
  };

  // 切换排序顺序
  const handleToggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // 处理拖拽结束
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = filteredWebsites.findIndex(item => item.id === active.id);
      const newIndex = filteredWebsites.findIndex(item => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedWebsites = arrayMove([...state.websites], oldIndex, newIndex);
        dispatch({ type: 'REORDER_WEBSITES', payload: reorderedWebsites });
      }
    }
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <Card
      title="网站列表"
      extra={
        <Input.Search
          placeholder="搜索网站..."
          allowClear
          style={{ 
            width: isMobile ? '100%' : 200,
            marginBottom: isMobile ? 8 : 0
          }}
          onChange={(e) => setSearchText(e.target.value)}
          size="small"
        />
      }
      style={{ borderRadius: 8, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)' }}
      bodyStyle={{ padding: 12 }}
    >
      <div style={{ marginBottom: 12 }}>
        <TextArea
          placeholder="输入网址，每行一个&#10;例如：&#10;github.com&#10;https://google.com&#10;stackoverflow.com"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{ 
            marginBottom: 8,
            minHeight: 80,
            resize: 'none' // 禁用手动调整大小
          }}
          autoSize={{
            minRows: 3
            // 移除maxRows，让输入框可以无限增长
          }}
          size="small"
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleBatchAdd}
          style={{ width: isMobile ? '100%' : 'auto' }}
          size="small"
        >
          批量添加
        </Button>
      </div>

      {filteredWebsites.length === 0 ? (
        <Empty
          description={
            <span style={{ fontSize: 14 }}>
              {searchText ? '没有找到匹配的网站' : '还没有添加网站，请在上方输入网址'}
            </span>
          }
          style={{ margin: '20px 0' }}
        />
      ) : (
        <>
          {/* 操作栏 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid var(--ant-color-border)'
          }}>
            <Space size={8}>
              <input
                type="checkbox"
                checked={filteredWebsites.length > 0 && selectedIds.length === filteredWebsites.length}
                onChange={handleSelectAll}
              />
              <span style={{ fontSize: 14 }}>全选</span>
              <span style={{ fontSize: 14, color: 'var(--ant-color-text-secondary)' }}>
                已选择 {selectedIds.length} / {filteredWebsites.length}
              </span>
            </Space>
            <Space size={8}>
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="none">默认顺序</Option>
                <Option value="name">按名称排序</Option>
                <Option value="url">按URL排序</Option>
              </Select>
              {sortBy !== 'none' && (
                <Button
                  icon={sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                  onClick={handleToggleSortOrder}
                  size="small"
                />
              )}
              <Popconfirm
                title={`确定要删除选中的 ${selectedIds.length} 个网站吗？`}
                onConfirm={handleBatchDelete}
                okText="确定删除"
                cancelText="取消"
                disabled={selectedIds.length === 0}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  disabled={selectedIds.length === 0}
                >
                  批量删除
                </Button>
              </Popconfirm>
            </Space>
          </div>

          {/* 网站列表 */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredWebsites.map(website => website.id)}
              strategy={verticalListSortingStrategy}
            >
              <List
                dataSource={filteredWebsites}
                renderItem={(website) => (
                  <WebsiteItem
                    key={website.id}
                    website={website}
                    onEdit={onEditWebsite}
                    selected={selectedIds.includes(website.id)}
                    onSelect={handleSelectWebsite}
                  />
                )}
                style={{ marginTop: 8 }}
                locale={{ emptyText: '没有网站' }}
              />
            </SortableContext>
          </DndContext>
        </>
      )}
    </Card>
  );
};
