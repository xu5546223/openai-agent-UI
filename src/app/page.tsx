'use client'; // 因為使用了 state 和事件處理，需要標記為 Client Component

import React, { useState } from 'react';
import ComponentSidebar from "@/components/ComponentSidebar";
import WorkflowCanvas from "../WorkflowCanvas";
import PropertiesPanel from "@/components/PropertiesPanel";
import { Button } from '@/components/ui/button'; // 引入 Button
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"; // 引入 Dialog 相關元件
import CustomLLMProviderList from '../components/settings/CustomLLMProviderList'; // 引入列表元件
import CustomLLMProviderForm from '../components/settings/CustomLLMProviderForm'; // 引入表單元件
import useWorkflowStore, { CustomLLMProvider } from '../store/workflowStore'; // 引入 Store 和類型
import { Settings } from 'lucide-react'; // 引入圖示

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingProvider, setEditingProvider] = useState<CustomLLMProvider | null>(null);

  const { addCustomLLMProvider, updateCustomLLMProvider } = useWorkflowStore();

  const handleOpenDialog = () => {
    setViewMode('list'); // 每次打開時重設為列表視圖
    setEditingProvider(null);
    setIsSettingsOpen(true);
  };

  const handleAdd = () => {
    setEditingProvider(null);
    setViewMode('form');
  };

  const handleEdit = (provider: CustomLLMProvider) => {
    setEditingProvider(provider);
    setViewMode('form');
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingProvider(null);
  };

  const handleSave = (providerData: Omit<CustomLLMProvider, 'id'> | CustomLLMProvider) => {
    if ('id' in providerData && providerData.id) {
      // 編輯模式 - 確保 id 存在且有效
      updateCustomLLMProvider(providerData.id, providerData);
    } else {
      // 新增模式
      addCustomLLMProvider(providerData as Omit<CustomLLMProvider, 'id'>);
    }
    setViewMode('list'); // 儲存後返回列表
    setEditingProvider(null);
  };


  return (
    <div className="flex flex-col h-screen">
      {/* 簡單的標頭區域 */}
      <header className="flex items-center justify-between p-2 border-b bg-background">
        <h1 className="text-lg font-semibold">OpenAI Agents Visual Designer</h1>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" onClick={handleOpenDialog}>
              <Settings className="h-4 w-4" />
              <span className="sr-only">開啟設定</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {viewMode === 'list'
                  ? '管理自訂 LLM 提供者'
                  : editingProvider
                  ? '編輯自訂 LLM 提供者'
                  : '新增自訂 LLM 提供者'}
              </DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              {viewMode === 'list' ? (
                <CustomLLMProviderList onAdd={handleAdd} onEdit={handleEdit} />
              ) : (
                <CustomLLMProviderForm
                  provider={editingProvider}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* 主要版面配置 */}
      <main className="main-layout flex-grow">
        <ComponentSidebar />
        <WorkflowCanvas />
        <PropertiesPanel />
      </main>
    </div>
  );
} 