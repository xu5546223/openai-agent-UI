'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps, useReactFlow, Edge, Node } from 'reactflow';
import { RunnerNodeData, AgentNodeData } from '../types';
import { Play, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const RunnerNode = ({ data, isConnectable, selected, id }: NodeProps<RunnerNodeData>) => {
  const { getNodes, getEdges } = useReactFlow();

  // Find the connected agent
  const connectedAgentName = React.useMemo(() => {
    const edges: Edge[] = getEdges();
    const nodes: Node[] = getNodes();
    // Find the edge connected to this runner's input handle ('a-input')
    const incomingEdge = edges.find(edge => edge.target === id && edge.targetHandle === 'a-input');
    if (!incomingEdge) return null;
    // Find the source node of that edge
    const sourceNode = nodes.find((node: Node): node is Node<AgentNodeData> => 
        node.id === incomingEdge.source && node.type === 'agent'
    );
    return sourceNode?.data?.name || `Agent ${sourceNode?.id.substring(0, 4)}`;
  }, [getEdges, getNodes, id]);

  return (
    <div className={cn(
      "react-flow__node-default",
      "runner-node w-60 border bg-white rounded-lg overflow-hidden",
      selected ? "ring-2 ring-offset-2 ring-blue-500 border-blue-500" : "border-gray-300",
      "shadow hover:shadow-md transition-shadow duration-150"
    )}>
      {/* Input Handle (Left) - Centered */}
      <Handle
        type="target"
        position={Position.Left}
        id="a-input"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-blue-500"
        style={{ top: '50%' }}
      />
      
      <div className="flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-b from-green-50 to-green-100 px-3 py-1.5 border-b border-green-200 flex items-center">
          <PlayCircle className="h-4 w-4 text-green-600 mr-1.5" />
          <span className="font-semibold text-xs text-green-800">Runner</span>
        </div>
        
        {/* Content Area */}
        <div className="p-2.5 text-xs space-y-1.5">
          {/* Execution Mode */}
          <div className="space-y-1">
            <div className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Execution Mode:</div>
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
            }}>
              {data.mode === 'async' ? 'Async' : 'Sync'}
            </div>
          </div>
          
          {/* Input */}
          <div className="space-y-1">
            <div className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Input:</div>
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              border: '2px solid #d1d5db',
              color: '#4b5563',
              maxHeight: '6rem',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {data.input || <span style={{ fontStyle: 'italic', color: '#9ca3af' }}>No initial input</span>}
            </div>
          </div>

          {/* Connected Agent - Display only if found */}
          {connectedAgentName && (
            <div className="space-y-1 pt-1 border-t border-gray-100 mt-1.5">
              <div className="text-gray-500 font-medium text-[10px] uppercase tracking-wider">Connected Agent:</div>
              <div style={{
                backgroundColor: '#eff6ff',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                border: '2px solid #93c5fd',
                color: '#2563eb',
                fontWeight: '600',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={connectedAgentName}>
                {connectedAgentName}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Output Handle (Bottom) - Centered */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="b-output"
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-green-500"
      />
    </div>
  );
};

export default memo(RunnerNode); 