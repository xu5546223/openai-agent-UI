'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ToolNodeData } from '../types';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToolNode = ({ data, isConnectable, selected }: NodeProps<ToolNodeData>) => {
  const hasParameters = data.parameters && data.parameters.length > 0;
  
  return (
    <div className={cn(
      "react-flow__node-default",
      "tool-node w-60 border bg-white rounded-lg overflow-hidden",
      selected ? "ring-2 ring-offset-2 ring-amber-500 border-amber-500" : "border-gray-300",
      "shadow hover:shadow-md transition-shadow duration-150"
    )}>
      {/* Output Handle (Top) - Centered */}
      <Handle
        type="source"
        position={Position.Top}
        id="a-output"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-amber-500"
      />

      <div className="flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-b from-amber-50 to-amber-100 px-3 py-1.5 border-b border-amber-200 flex items-center">
          <Wrench className="h-4 w-4 text-amber-600 mr-1.5" />
          <span className="font-semibold text-xs text-amber-800">Function Tool</span>
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
            }} title={data.name || 'Unnamed tool'}>
              {data.name || <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>Unnamed tool</span>}
            </div>
          </div>
          
          {/* Parameters and Return Type */}
          <div className="space-y-1.5">
            {/* Parameters */}
            <div className="space-y-1">
              <div className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Parameters:</div>
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '2px solid #d1d5db',
                color: '#4b5563',
                maxHeight: '4rem',
                overflowY: 'auto'
              }}>
                {hasParameters
                  ? data.parameters.slice(0, 3).map((p, i) => (
                      <div key={i} style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={`${p.name}: ${p.type}`}>
                        <span style={{ color: '#b45309', fontWeight: '500' }}>{p.name}</span>
                        <span style={{ color: '#2563eb' }}>: {p.type}</span>
                      </div>
                    ))
                  : <div style={{ fontStyle: 'italic', color: '#9ca3af' }}>No parameters</div>}
                {hasParameters && data.parameters.length > 3 && (
                  <div style={{ fontStyle: 'italic', color: '#6b7280' }}>+{data.parameters.length - 3} more...</div>
                )}
              </div>
            </div>
            {/* Return Type */}
            <div className="space-y-1 pt-1 border-t border-gray-100">
              <div className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Return Type:</div>
              <div style={{
                backgroundColor: '#eff6ff',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '2px solid #93c5fd',
                color: '#2563eb',
                fontWeight: '500',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={data.returnType || 'str'}>
                {data.returnType || 'str'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Handle (Bottom) - Centered */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="b-input"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-amber-500"
      />
    </div>
  );
};

export default memo(ToolNode); 