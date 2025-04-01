'use client'; // Required for hooks and event handlers

import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  ReactFlowInstance,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css'; // Base styles for React Flow
// No longer need shallow
// import { shallow } from 'zustand/shallow';

import useWorkflowStore, { RFState } from './store/workflowStore';
import AgentNode from './nodes/AgentNode'; // Placeholder for custom node
import RunnerNode from './nodes/RunnerNode'; // Placeholder for custom node
import ToolNode from './nodes/ToolNode';   // Placeholder for custom node
import { NodeType } from './types';
import { Zap } from 'lucide-react';

// Define the mapping from node type string to the actual component
const nodeTypes: NodeTypes = {
  agent: AgentNode,
  runner: RunnerNode,
  tool: ToolNode,
  // guardrail: GuardrailNode, // Add later if needed
};

function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  // Select individual state pieces or small related groups
  const nodes = useWorkflowStore((state: RFState) => state.nodes);
  const edges = useWorkflowStore((state: RFState) => state.edges);
  const onNodesChange = useWorkflowStore((state: RFState) => state.onNodesChange);
  const onEdgesChange = useWorkflowStore((state: RFState) => state.onEdgesChange);
  const storeOnConnect = useWorkflowStore((state: RFState) => state.onConnect);
  const setSelectedNodeId = useWorkflowStore((state: RFState) => state.setSelectedNodeId);
  const addNode = useWorkflowStore((state: RFState) => state.addNode);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation(); // Prevent pane click when clicking node
      setSelectedNodeId(node.id);
      console.log('Selected node:', node.id);
    },
    [setSelectedNodeId]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    console.log('Pane clicked, deselected node');
  }, [setSelectedNodeId]);

  // --- Drag and Drop Logic ---
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        console.error("ReactFlow wrapper or instance not available for drop");
        return;
      }

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;

      // Check if the dropped type is valid
      if (typeof type === 'undefined' || !type) {
         console.warn("Dropped item has no valid reactflow type");
        return;
      }

      // Calculate position relative to the React Flow pane
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      console.log(`Dropping node type ${type} at`, position);
      addNode(type, position); // Add node via Zustand store
    },
    [reactFlowInstance, addNode]
  );
  // --- End Drag and Drop Logic ---

  // Wrap the store's onConnect
  const onConnect: OnConnect = useCallback(
    (connection) => {
      storeOnConnect(connection);
    },
    [storeOnConnect]
  );

  return (
    // 使用我們新添加的 react-flow-wrapper 類
    <div className="react-flow-wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange} // Use the store's handler
        onEdgesChange={onEdgesChange} // Use the store's handler
        onConnect={onConnect} // Use the wrapped store handler
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes} // Pass custom node components
        onInit={setReactFlowInstance} // Store instance for drop calculation
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView // Optional: Adjust initial view
        className="react-flow-canvas" // 使用我們新添加的 react-flow-canvas 類
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { strokeWidth: 1.5 },
          animated: true,
        }}
      >
        <Background color="#d9d9d9" gap={20} size={1} />
        <Controls showInteractive={false} className="bg-white border shadow-sm" />
        <MiniMap 
          nodeStrokeWidth={2} 
          zoomable 
          pannable 
          className="bg-white border shadow-sm"
          nodeBorderRadius={2}
        />
        <Panel position="top-right" className="bg-white/70 backdrop-blur p-2 rounded border shadow-sm text-xs text-gray-500">
          <div className="flex items-center">
            <Zap className="h-3 w-3 mr-1 text-blue-500" />
            {nodes.length} 節點 • {edges.length} 連接
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default WorkflowCanvas; 