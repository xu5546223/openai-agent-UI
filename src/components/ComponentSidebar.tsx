'use client'; // Required for event handlers like onDragStart

import React from 'react';
import { NodeType } from '../types'; // Import NodeType
import { Bot, Play, Wrench, Layers } from 'lucide-react';
import { cn } from "@/lib/utils"; // 引入 cn 工具函數

interface DraggableNodeProps {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: "blue" | "red" | "amber" | "purple"; // 限制顏色選項
}

const DraggableNode = ({ type, label, description, icon, color }: DraggableNodeProps) => {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // 預定義不同顏色的邊框和背景樣式
  const colorStyles = {
    blue: {
      hover: "hover:border-blue-300",
      iconBg: "bg-blue-100 border-blue-200"
    },
    red: {
      hover: "hover:border-red-300",
      iconBg: "bg-red-100 border-red-200"
    },
    amber: {
      hover: "hover:border-amber-300",
      iconBg: "bg-amber-100 border-amber-200"
    },
    purple: {
      hover: "hover:border-purple-300",
      iconBg: "bg-purple-100 border-purple-200"
    }
  };

  return (
    <div
      className={cn(
        "draggable-item mb-3 p-3 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all cursor-grab hover:scale-[1.02]",
        colorStyles[color].hover
      )}
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border", colorStyles[color].iconBg)}>
          {icon}
        </div>
        <div className="font-medium">{label}</div>
      </div>
      <div className="text-xs text-gray-500 pl-11">{description}</div>
    </div>
  );
};

function ComponentSidebar() {
  return (
    <aside className="sidebar min-w-64 border-r border-gray-200 bg-gray-50 shadow-sm">
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-600" />
          <h2 className="text-sm font-semibold">元件庫</h2>
        </div>
      </div>
      
      <div className="p-4 flex flex-col">
        <DraggableNode 
          type="agent" 
          label="Agent" 
          description="具有指令和工具的 AI 助手" 
          icon={<Bot className="h-4 w-4 text-blue-500" />}
          color="blue"
        />
        <DraggableNode 
          type="runner" 
          label="Runner" 
          description="執行 Agent 工作流程" 
          icon={<Play className="h-4 w-4 text-red-500" />}
          color="red"
        />
        <DraggableNode 
          type="tool" 
          label="Function Tool" 
          description="Agent 可以使用的自定義 Python 函數" 
          icon={<Wrench className="h-4 w-4 text-amber-500" />}
          color="amber"
        />
        {/* Add Guardrail node later if needed */}
        {/* <DraggableNode 
          type="guardrail" 
          label="Guardrail" 
          description="輸入/輸出驗證規則" 
          icon={<Shield className="h-4 w-4 text-purple-500" />}
          color="purple"
        /> */}
      </div>

      <div className="mt-auto p-4 text-xs text-gray-500 text-center border-t border-gray-200 bg-white">
        <div className="flex flex-col items-center">
          <span className="mb-1">拖曳元件到畫布上</span>
          <span className="text-gray-400">點擊節點可編輯屬性</span>
        </div>
      </div>
    </aside>
  );
}

export default ComponentSidebar; 