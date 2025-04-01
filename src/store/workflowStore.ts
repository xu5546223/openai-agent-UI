import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  XYPosition,
} from 'reactflow';
import { nanoid } from 'nanoid'; // For generating unique IDs
import { AgentNodeData, NodeData, NodeType, RunnerNodeData, ToolNodeData, Parameter } from '../types'; // Assuming types exist

// Helper function to check connection validity
const isValidConnection = (connection: Connection, nodes: Node<NodeData>[]): boolean => {
  const { source, target, sourceHandle, targetHandle } = connection;

  // Find source and target nodes
  const sourceNode = nodes.find((node) => node.id === source);
  const targetNode = nodes.find((node) => node.id === target);

  // Basic checks: nodes must exist, no self-connections
  if (!sourceNode || !targetNode || source === target) {
    console.warn('Invalid connection attempt: Node not found or self-connection.', connection);
    return false;
  }

  console.log(`Attempting connection: ${sourceNode.type}(${sourceHandle}) -> ${targetNode.type}(${targetHandle})`);

  // Define allowed connections based on node types and handles
  const sourceType = sourceNode.type as NodeType;
  const targetType = targetNode.type as NodeType;

  // Rule 1: Agent -> Agent (Handoff)
  if (sourceType === 'agent' && targetType === 'agent') {
    if (sourceHandle === 'b-output' && targetHandle === 'a-input') {
      return true;
    }
  }

  // Rule 2: Agent -> Runner (Execution Start)
  if (sourceType === 'agent' && targetType === 'runner') {
    if (sourceHandle === 'b-output' && targetHandle === 'a-input') {
      return true;
    }
  }

  // Rule 3: Tool -> Agent (Provide Tool)
  if (sourceType === 'tool' && targetType === 'agent') {
    if (sourceHandle === 'a-output' && targetHandle === 'c-tools') {
      return true;
    }
  }

  // If none of the rules match, the connection is invalid
  console.warn('Invalid connection type or handle:', connection, { sourceType, targetType, sourceHandle, targetHandle });
  return false;
};

// 定義自訂 LLM Provider 的類型
export interface CustomLLMProvider {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  modelName: string;
}

// ---> 加上 export 關鍵字 <---
export type RFState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (type: NodeType, position: XYPosition) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  getNodes: () => Node<NodeData>[]; // Helper for code generator
  getEdges: () => Edge[];         // Helper for code generator
  customLLMProviders: CustomLLMProvider[];
  addCustomLLMProvider: (provider: Omit<CustomLLMProvider, 'id'>) => void;
  updateCustomLLMProvider: (id: string, updates: Partial<Omit<CustomLLMProvider, 'id'>>) => void;
  deleteCustomLLMProvider: (id: string) => void;
};

const useWorkflowStore = create<RFState>((set, get) => ({
  nodes: [], // Initial nodes
  edges: [], // Initial edges
  selectedNodeId: null,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    // *** Use the validation function ***
    if (!isValidConnection(connection, get().nodes)) {
      return; // Abort connection if invalid
    }

    // If valid, proceed to add the edge
    const newEdge = {
      ...connection,
      id: `edge-${nanoid()}`, // Ensure unique edge ID with prefix
      // type: 'custom-edge' // Optional: if you need custom edges
    };
    set((state) => ({
      edges: addEdge(newEdge, state.edges),
    }));
    console.log('Connection added:', newEdge);
  },
  addNode: (type: NodeType, position: XYPosition) => {
    const newNodeId = `${type}-${nanoid(6)}`; // Create a more descriptive ID
    let newNodeData: NodeData;

    // Set default data based on node type
    switch (type) {
      case 'agent':
        newNodeData = {
            name: `Agent ${newNodeId.substring(6, 10)}`,
            instructions: '',
            modelName: 'gpt-4',
            temperature: 0.7,
            customLLMProviderId: null
        } as AgentNodeData;
        break;
      case 'runner':
        newNodeData = {
            input: '',
            mode: 'sync',
            executionMode: 'run'
        } as RunnerNodeData;
        break;
      case 'tool':
        newNodeData = {
            name: `tool_${newNodeId.substring(5, 9)}`,
            description: 'A new tool',
            parameters: [] as Parameter[],
            returnType: 'str',
            implementation: `def ${`tool_${newNodeId.substring(5, 9)}`}(**kwargs):\n    # TODO: Implement tool logic\n    print(f"Executing tool ${`tool_${newNodeId.substring(5, 9)}`} with args: {kwargs}")\n    return \"Tool result\"`
        } as ToolNodeData;
        break;
      default:
        // Provide a default structure for unknown types if necessary
        console.warn(`Attempting to add node with unknown type: ${type}`);
        newNodeData = { label: `Node ${newNodeId.substring(0, 4)}` };
        // Optionally return or throw an error if the type is strictly controlled
        // return;
    }

    const newNode: Node<NodeData> = {
      id: newNodeId,
      type,
      position,
      data: newNodeData,
      // Ensure dragHandle is specified if you use custom node components without inherent dragging
      // dragHandle: '.custom-drag-handle', // Example selector
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },
  setSelectedNodeId: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
    // Update node selection state for visual feedback
    set({
        nodes: get().nodes.map(n => ({
            ...n,
            selected: n.id === nodeId
        }))
    });
  },
  getNodes: () => get().nodes,
  getEdges: () => get().edges,
  customLLMProviders: [],
  addCustomLLMProvider: (provider: Omit<CustomLLMProvider, 'id'>) => {
    const newProvider = {
      id: nanoid(),
      ...provider,
    };
    set((state) => ({
      customLLMProviders: [...state.customLLMProviders, newProvider],
    }));
  },
  updateCustomLLMProvider: (id: string, updates: Partial<Omit<CustomLLMProvider, 'id'>>) => {
    set({
      customLLMProviders: get().customLLMProviders.map((provider) =>
        provider.id === id ? { ...provider, ...updates } : provider
      ),
    });
  },
  deleteCustomLLMProvider: (id: string) => {
    set({
      customLLMProviders: get().customLLMProviders.filter((provider) => provider.id !== id),
    });
  },
}));

export default useWorkflowStore;