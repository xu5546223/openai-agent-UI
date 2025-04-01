'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Code, Save, FolderOpen, Settings, Sparkles } from 'lucide-react';
import CodeModal from './CodeModal';
import TestModal from './TestModal';
import useWorkflowStore from '@/store/workflowStore';
import { generateCode as generateCodeFunc } from '@/lib/codeGenerator';
import { toast } from '@/components/ui/use-toast';

function Navbar() {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const getNodes = useWorkflowStore((state) => state.getNodes);
  const getEdges = useWorkflowStore((state) => state.getEdges);
  const customLLMProvidersFromStore = useWorkflowStore((state) => state.customLLMProviders);

  useEffect(() => {
    console.log("模態框狀態變更:", isCodeModalOpen, "代碼長度:", generatedCode.length);
  }, [isCodeModalOpen, generatedCode]);

  useEffect(() => {
    console.log("Navbar 組件已掛載");
    return () => {
      console.log("Navbar 組件將卸載");
    };
  }, []);

  const handleGenerateCode = () => {
    console.log("開始生成程式碼");
    const nodes = getNodes();
    const edges = getEdges();
    const customLLMProviders = customLLMProvidersFromStore;
    
    console.log("使用的節點和邊:", { 
      nodes: nodes.length, 
      edges: edges.length,
      nodeTypes: nodes.map(n => n.type).join(', ')
    });
    console.log("[Navbar] Providers from store:", JSON.stringify(customLLMProviders));
    const providersToPass = customLLMProviders || [];
    console.log("[Navbar] Providers to pass:", JSON.stringify(providersToPass), "Is Array:", Array.isArray(providersToPass));
    
    try {
      if (nodes.length === 0) {
        console.log("無節點可用，無法生成程式碼");
        toast({
          title: "無法生成程式碼",
          description: "請先添加一些節點到畫布上",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      const code = generateCodeFunc(nodes, edges, providersToPass);
      console.log("程式碼生成成功，長度:", code.length);
      
      setGeneratedCode(code);
      console.log("正在設置模態框狀態為開啟");
      setIsCodeModalOpen(true);
      
      toast({
        title: "程式碼生成成功",
        description: "已顯示生成的程式碼",
        duration: 2000,
      });
    } catch (error) {
      console.error("生成程式碼時發生錯誤:", error);
      toast({
        title: "生成程式碼時發生錯誤",
        description: "詳情請查看控制台",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleOpenTestModal = () => {
    console.log("開啟測試模態框");
    setIsTestModalOpen(true);
  };

  const handleCloseModal = () => {
    console.log("正在關閉模態框");
    setIsCodeModalOpen(false);
  };

  const handleCloseTestModal = () => {
    console.log("關閉測試模態框");
    setIsTestModalOpen(false);
  };

  const handleSave = () => { alert('儲存功能尚未實現。'); };
  const handleLoad = () => { alert('載入功能尚未實現。'); };
  const handleSettings = () => { alert('設定功能尚未實現。'); };

  return (
    <>
      <header className="navbar flex items-center justify-between h-14 border-b border-gray-200 bg-white px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <span className="font-medium text-gray-700">OpenAI Agents 視覺化設計工具</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size="sm" 
            onClick={handleOpenTestModal}
            className="text-sm border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
          >
            測試模態框
          </Button>
          
          <Button 
            variant="outline"
            size="sm" 
            onClick={handleGenerateCode}
            className="text-sm border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
          >
            <Code className="h-4 w-4 mr-2" />
            生成程式碼
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSave}
            className="text-sm border-gray-200 hover:bg-gray-50"
          >
            <Save className="h-4 w-4 mr-2" />
            儲存
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLoad}
            className="text-sm border-gray-200 hover:bg-gray-50"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            載入
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettings}
            className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {isCodeModalOpen && (
        <CodeModal
          isOpen={isCodeModalOpen}
          onClose={handleCloseModal}
          code={generatedCode}
        />
      )}

      <TestModal 
        isOpen={isTestModalOpen}
        onClose={handleCloseTestModal}
      />
    </>
  );
}

export default Navbar; 