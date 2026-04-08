import React, { useState } from 'react';
import { Card, Switch, Button, Input, Space, Popconfirm, Tooltip, Empty, message } from 'antd';
import { EditOutlined, DeleteOutlined, GlobalOutlined, LinkOutlined, PlusOutlined, MenuOutlined } from '@ant-design/icons';
import { useApp, Website } from '../stores/AppContext';
import { useOpenWebsites } from '../hooks/useOpenWebsites';
import { extractDomain, normalizeUrl, isValidUrl } from '../utils/url';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { TextArea } = Input;

interface WebsiteItemProps {
  website: Website;
  onEdit: (website: Website) => void;
  selected: boolean;
  onSelect: (id: string) => void;
}

function SortableItem({ website, onEdit, selected, onSelect }: WebsiteItemProps) {
  const { dispatch } = useApp();
  const { openSingle } = useOpenWebsites();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: website.id,
    // 关键：明确指定拖拽激活器
  });

  return (
    <div ref={setNodeRef} style={{
      transform: CSS.Transform.toString(transform),
      transition,
      padding: '12px',
      borderBottom: '1px solid var(--ant-color-border)',
      opacity: isDragging ? 0.4 : 1,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: isDragging ? 'var(--ant-color-fill-alter)' : 'transparent',
      zIndex: isDragging ? 999 : 1,
    }}>
      <Space size={8}>
        <input type="checkbox" checked={selected} onChange={() => onSelect(website.id)} />
        {/* 只有这个按钮可以触发拖拽 */}
        <button 
          {...attributes} 
          {...listeners}
          data-drag-handle={website.id}
          style={{ background: 'none', border: 'none', cursor: 'grab', padding: 4 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <MenuOutlined style={{ fontSize: 16, color: 'var(--ant-color-text-secondary)' }} />
        </button>
      </Space>
      
      <GlobalOutlined style={{ fontSize: 20, color: 'var(--ant-color-text-secondary)', flexShrink: 0 }} />
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <Space size={8}>
          <Switch checked={website.enabled} onChange={() => dispatch({ type: 'TOGGLE_WEBSITE', payload: website.id })} size="small" />
          <a href={website.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', fontSize: 14, fontWeight: 500, opacity: website.enabled ? 1 : 0.5, textDecoration: 'none' }}>
            {website.name}
          </a>
        </Space>
        <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {website.url}
        </div>
      </div>
      
      <Space size={4} style={{ flexShrink: 0 }}>
        <Tooltip title="打开"><Button type="text" icon={<LinkOutlined />} onClick={() => openSingle(website.id)} size="small" /></Tooltip>
        <Tooltip title="编辑"><Button type="text" icon={<EditOutlined />} onClick={() => onEdit(website)} size="small" /></Tooltip>
        <Popconfirm title="确定要删除这个网站吗？" onConfirm={() => dispatch({ type: 'DELETE_WEBSITE', payload: website.id })} okText="确定" cancelText="取消">
          <Tooltip title="删除"><Button type="text" danger icon={<DeleteOutlined />} size="small" /></Tooltip>
        </Popconfirm>
      </Space>
    </div>
  );
}

export const WebsiteList: React.FC<{ onEditWebsite: (w: Website) => void }> = ({ onEditWebsite }) => {
  const { state, dispatch } = useApp();
  const [searchText, setSearchText] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 计算显示的列表（用于渲染）
  const displayWebsites = React.useMemo(() => {
    let list = [...state.websites];
    
    if (searchText.trim()) {
      list = list.filter(w => 
        w.name.toLowerCase().includes(searchText.toLowerCase()) ||
        w.url.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    return list;
  }, [state.websites, searchText]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // 验证：只有点击 ☰ 按钮才允许拖拽
  function handleDragStart(event: any) {
    const { active } = event;
    // 检查事件目标是否是按钮（通过 data 属性标记）
    const dragHandle = document.querySelector(`[data-drag-handle="${active.id}"]`);
    if (!dragHandle) {
      event.active = null; // 取消拖拽
    }
  }

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = displayWebsites.findIndex(w => w.id === active.id);
    const newIndex = displayWebsites.findIndex(w => w.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      // 在显示列表中重排
      const reorderedDisplay = arrayMove(displayWebsites, oldIndex, newIndex);
      
      // 合并回完整列表：保持未显示的项目不变
      const hiddenWebsites = state.websites.filter(w => !displayWebsites.some(dw => dw.id === w.id));
      dispatch({ type: 'REORDER_WEBSITES', payload: [...hiddenWebsites, ...reorderedDisplay] });
    }
  }

  function handleBatchAdd() {
    const lines = inputText.split('\n').map(l => l.trim()).filter(l => l);
    if (!lines.length) { message.warning('请输入网址'); return; }
    
    let added = 0, dup = 0;
    lines.forEach(line => {
      const url = normalizeUrl(line);
      if (!isValidUrl(line)) return;
      if (state.websites.some(w => normalizeUrl(w.url) === url)) { dup++; return; }
      dispatch({ type: 'ADD_WEBSITE', payload: { name: extractDomain(url), url, enabled: true } });
      added++;
    });
    
    if (added) { message.success(`添加 ${added} 个`); setInputText(''); }
    if (dup) message.info(`${dup} 个已存在`);
    if (!added && !dup) message.error('无效网址');
  }

  return (
    <Card title="网站列表" extra={
      <Input.Search placeholder="搜索..." allowClear style={{ width: 200 }} onChange={e => setSearchText(e.target.value)} size="small" />
    } style={{ borderRadius: 8 }} styles={{ body: { padding: 12 } }}>
      <div style={{ marginBottom: 12 }}>
        <TextArea placeholder="每行一个网址&#10;github.com&#10;google.com" value={inputText} onChange={e => setInputText(e.target.value)} autoSize={{ minRows: 3 }} size="small" />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleBatchAdd} style={{ marginTop: 8 }}>批量添加</Button>
      </div>

      {!displayWebsites.length ? (
        <Empty description={searchText ? '无匹配结果' : '暂无网站'} />
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--ant-color-border)' }}>
            <Space>
              <input type="checkbox" checked={!!displayWebsites.length && selectedIds.length === displayWebsites.length} onChange={() => setSelectedIds(selectedIds.length === displayWebsites.length ? [] : displayWebsites.map(w => w.id))} />
              <span>全选</span>
              <span style={{ color: 'var(--ant-color-text-secondary)' }}>{selectedIds.length}/{displayWebsites.length}</span>
            </Space>
            <Popconfirm title={`删除 ${selectedIds.length} 个？`} onConfirm={() => { selectedIds.forEach(id => dispatch({ type: 'DELETE_WEBSITE', payload: id })); setSelectedIds([]); message.success('已删除'); }} okText="删除">
              <Button danger icon={<DeleteOutlined />} size="small" disabled={!selectedIds.length}>批量删除</Button>
            </Popconfirm>
          </div>

          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={displayWebsites.map(w => w.id)} strategy={verticalListSortingStrategy}>
              <div style={{ border: '1px solid var(--ant-color-border)', borderRadius: 6, overflow: 'hidden' }}>
                {displayWebsites.map(w => (
                  <SortableItem key={w.id} website={w} onEdit={onEditWebsite} selected={selectedIds.includes(w.id)} onSelect={id => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </Card>
  );
};
