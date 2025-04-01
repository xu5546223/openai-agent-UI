'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps, Edge, Node, useNodes, useEdges } from 'reactflow';
import { AgentNodeData } from '../types';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const AgentNode = ({ data, isConnectable, selected, id }: NodeProps<AgentNodeData>) => {
  // Get current nodes and edges using hooks
  const nodes = useNodes();
  const edges = useEdges();

  // Recalculate handoffTargets using useMemo based on nodes and edges
  const handoffTargets = React.useMemo(() => {
    const sourceEdges = edges.filter(
      (edge: Edge) => edge.source === id && edge.sourceHandle === 'b-output'
    );
    
    return sourceEdges
      .map((edge: Edge) => nodes.find((node: Node) => node.id === edge.target))
      .filter((node): node is Node<AgentNodeData> => !!node && node.type === 'agent')
      .map((node: Node<AgentNodeData>) => node.data.name || `Agent ${node.id.substring(0, 4)}`);
  }, [nodes, edges, id]); // Dependencies are nodes, edges, and the node's id

  return (
    <div className={cn(
      "react-flow__node-default", // 使用 React Flow 預設 class 以確保基本樣式和互動
      "agent-node w-60 border bg-white rounded-lg overflow-hidden", // 調整寬度和圓角
      selected ? "ring-2 ring-offset-2 ring-blue-500 border-blue-500" : "border-gray-300", // 調整選中樣式
      "shadow hover:shadow-md transition-shadow duration-150"
    )}>
      {/* Input Handle (Left) - Centered */}
      <Handle
        type="target"
        position={Position.Left}
        id="a-input"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-blue-500"
        style={{ top: '50%' }} // 預設會垂直居中
      />

      <div className="flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-b from-blue-50 to-blue-100 px-3 py-1.5 border-b border-blue-200 flex items-center">
          <Bot className="h-4 w-4 text-blue-600 mr-1.5" />
          <span className="font-semibold text-xs text-blue-800">Agent</span>
        </div>
        
        {/* Content Area */}
        <div className="p-2.5 text-xs space-y-1.5">
          {/* Name */}
          <div className="space-y-1">
            <div className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Name:</div>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              border: '2px solid #d1d5db',
              color: '#1f2937',
              fontWeight: '600',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }} title={data.name || 'Unnamed agent'}>
              {data.name || <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>Unnamed agent</span>}
            </div>
          </div>
          
          {/* Instructions */}
          <div className="space-y-1">
            <div className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Instructions:</div>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              border: '2px solid #d1d5db',
              color: '#4b5563',
              maxHeight: '6rem',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }} title={data.instructions || 'No instructions'}> 
              {data.instructions || <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>No instructions</span>}
            </div>
          </div>
          
          {/* Handoffs List */}
          {handoffTargets && handoffTargets.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-gray-100 mt-1.5">
              <div className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Handoffs:</div>
              <div style={{
                backgroundColor: '#eff6ff',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '2px solid #93c5fd',
                maxHeight: '4rem',
                overflowY: 'auto',
              }}>
                {handoffTargets.map((target: string, index: number) => (
                  <div key={index} style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: '#2563eb',
                    fontWeight: '500'
                  }} title={target}>{target}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Output Handle (Right) - Centered */}
      <Handle
        type="source"
        position={Position.Right}
        id="b-output" // This is the handle for handoffs
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-blue-500"
        style={{ top: '50%' }}
      />
      
      {/* Tool Input Handle (Bottom) - Centered */} 
      <Handle
        type="target"
        position={Position.Bottom}
        id="c-tools"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-amber-500"
      />
    </div>
  );
};

export default memo(AgentNode); 