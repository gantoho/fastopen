import React, { useState, useEffect } from 'react';
import { Card, List, Button, Space, Tag, Popconfirm, Tooltip, Empty, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useApp, SubPathPreset } from '../stores/AppContext';

interface SubPathPresetModalProps {
  visible: boolean;
  onCancel: () => void;
  editingPreset?: SubPathPreset | null;
}

const SubPathPresetModal: React.FC<SubPathPresetModalProps> = ({
  visible,
  onCancel,
  editingPreset,
}) => {
  const { dispatch } = useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingPreset) {
      form.setFieldsValue({
        name: editingPreset.name,
        paths: editingPreset.paths.join('\n'),
      });
    } else {
      form.resetFields();
    }
  }, [editingPreset, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const paths = values.paths
        .split('\n')
        .map((p: string) => p.trim())
        .filter((p: string) => p);

      if (paths.length === 0) {
        message.error('请至少添加一个子路径');
        return;
      }

      if (editingPreset) {
        dispatch({
          type: 'UPDATE_SUB_PATH_PRESET',
          payload: {
            ...editingPreset,
            name: values.name,
            paths,
          },
        });
        message.success('子路径预设已更新');
      } else {
        dispatch({
          type: 'ADD_SUB_PATH_PRESET',
          payload: {
            name: values.name,
            paths,
          },
        });
        message.success('子路径预设已添加');
      }

      onCancel();
    });
  };

  return (
    <Modal
      title={editingPreset ? '编辑子路径预设' : '添加子路径预设'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="预设名称"
          rules={[{ required: true, message: '请输入预设名称' }]}
        >
          <Input placeholder="例如：基本路径" />
        </Form.Item>
        <Form.Item
          name="paths"
          label="子路径"
          rules={[{ required: true, message: '请输入子路径' }]}
        >
          <Input.TextArea
            placeholder="输入子路径，每行一个\n例如：\n/\n/about\n/contact"
            rows={4}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const SubPathPresetManager: React.FC = () => {
  const { state, dispatch } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPreset, setEditingPreset] = useState<SubPathPreset | null>(null);

  const handleAdd = () => {
    setEditingPreset(null);
    setModalVisible(true);
  };

  const handleEdit = (preset: SubPathPreset) => {
    setEditingPreset(preset);
    setModalVisible(true);
  };

  const handleDelete = (presetId: string) => {
    dispatch({ type: 'DELETE_SUB_PATH_PRESET', payload: presetId });
    message.success('子路径预设已删除');
  };

  const handleSelect = (presetId: string) => {
    dispatch({ type: 'SELECT_PRESET', payload: presetId });
    message.success('已选择子路径预设');
  };

  return (
    <>
      <Card
        title="子路径预设管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加预设
          </Button>
        }
      >
        {state.subPathPresets.length === 0 ? (
          <Empty
            description="还没有添加子路径预设"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={state.subPathPresets}
            renderItem={(preset) => (
              <List.Item
                actions={[
                  <Tooltip title="选择" key="select">
                    <Button
                      type={state.selectedPresetId === preset.id ? 'primary' : 'default'}
                      icon={<CheckOutlined />}
                      onClick={() => handleSelect(preset.id)}
                    >
                      {state.selectedPresetId === preset.id ? '已选择' : '选择'}
                    </Button>
                  </Tooltip>,
                  <Tooltip title="编辑" key="edit">
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(preset)} />
                  </Tooltip>,
                  <Popconfirm
                    key="delete"
                    title="确定要删除这个预设吗？"
                    onConfirm={() => handleDelete(preset.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Tooltip title="删除">
                      <Button danger icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <span style={{ fontWeight: state.selectedPresetId === preset.id ? 'bold' : 'normal' }}>
                        {preset.name}
                      </span>
                      {state.selectedPresetId === preset.id && (
                        <Tag color="blue">已选择</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space wrap>
                      {preset.paths.map((path, index) => (
                        <Tag key={index}>{path}</Tag>
                      ))}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <SubPathPresetModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        editingPreset={editingPreset}
      />
    </>
  );
};
