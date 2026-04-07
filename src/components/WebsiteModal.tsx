import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useApp } from '../stores/AppContext';
import { Website } from '../types';
import { normalizeUrl, isValidUrl } from '../utils/url';

interface WebsiteModalProps {
  visible: boolean;
  onCancel: () => void;
  editingWebsite?: Website | null;
}

export const WebsiteModal: React.FC<WebsiteModalProps> = ({
  visible,
  onCancel,
  editingWebsite,
}) => {
  const [form] = Form.useForm();
  const { dispatch } = useApp();
  const isEditing = !!editingWebsite;

  useEffect(() => {
    if (visible) {
      if (editingWebsite) {
        form.setFieldsValue(editingWebsite);
      } else {
        form.resetFields();
      }
    }
  }, [visible, editingWebsite, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const normalizedUrl = normalizeUrl(values.url);

      if (!isValidUrl(values.url)) {
        message.error('请输入有效的URL');
        return;
      }

      if (isEditing && editingWebsite) {
        dispatch({
          type: 'UPDATE_WEBSITE',
          payload: {
            ...editingWebsite,
            ...values,
            url: normalizedUrl,
          },
        });
        message.success('网站更新成功');
      } else {
        dispatch({
          type: 'ADD_WEBSITE',
          payload: {
            ...values,
            url: normalizedUrl,
            enabled: true,
          },
        });
        message.success('网站添加成功');
      }

      onCancel();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={isEditing ? '编辑网站' : '添加网站'}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          {isEditing ? '更新' : '添加'}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        name="website_form"
        initialValues={{ enabled: true }}
      >
        <Form.Item
          name="name"
          label="网站名称"
          rules={[{ required: true, message: '请输入网站名称' }]}
        >
          <Input placeholder="例如：GitHub" />
        </Form.Item>

        <Form.Item
          name="url"
          label="网站地址"
          rules={[{ required: true, message: '请输入网站地址' }]}
        >
          <Input placeholder="例如：github.com 或 https://github.com" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
