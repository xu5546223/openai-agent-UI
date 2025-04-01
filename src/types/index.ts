import { Node } from 'reactflow';

// Define allowed node types
export type NodeType = 'agent' | 'runner' | 'tool' | 'guardrail'; // Added guardrail preemptively

// Base interface for node data (can be extended)
export interface BaseNodeData {
  label?: string; // For generic nodes or fallback
}

// --- Specific Node Data Interfaces ---

// For Function Tool parameters
export interface Parameter {
  name: string;
  type: 'str' | 'int' | 'float' | 'bool' | 'list' | 'dict' | string; // Allow string for custom types
}

// Interface for MCP Server configuration
export interface MCPServerConfig {
  id: string; // Unique identifier for the server instance
  name: string; // User-defined name for easy identification
  type: 'stdio' | 'sse';
  cacheToolsList: boolean;
  // Stdio specific fields
  command?: string;
  args?: string[]; // Store args as an array of strings
  // SSE specific fields
  url?: string;
}

export interface ToolNodeData extends BaseNodeData {
  name: string;
  description?: string;
  parameters: Parameter[];
  returnType: 'str' | 'int' | 'float' | 'bool' | 'list' | 'dict' | 'None' | string; // Allow string for custom types like Pydantic models
  implementation: string; // Python code snippet
}

// Consider defining Guardrail types later based on SDK examples
// export interface GuardrailData extends BaseNodeData { ... }

export interface AgentNodeData extends BaseNodeData {
  name: string;
  instructions: string;
  handoff_description?: string; // Optional based on requirements
  output_type?: 'none' | 'pydantic' | string; // String for specific Pydantic model names
  pydantic_model_name?: string; // If output_type is pydantic
  model_settings?: any; // Placeholder for model settings (API key, endpoint, etc.)
  modelName?: string; // Model name (e.g., gpt-4, gpt-3.5-turbo)
  temperature?: number; // Temperature setting for the model (0-1)
  customLLMProviderId?: string | null; // ID of the selected custom LLM provider
  guardrails?: any[]; // Placeholder for guardrail configuration
  handoffTargets?: string[]; // IDs of agents this agent can hand off to
  mcpServers?: MCPServerConfig[]; // MCP server configurations
  // 'tools' and 'handoffs' are typically derived from edges during code generation
}

export interface RunnerNodeData extends BaseNodeData {
  input: string;
  mode: 'sync' | 'async';
  executionMode?: 'run' | 'stream'; // <--- 新增欄位 (預設為 'run')
  context?: string; // Store as JSON string or parsed object?
}

// --- Union Type for all possible Node Data --- 
// This helps ensure our node data handling is type-safe.
export type NodeData = BaseNodeData | AgentNodeData | RunnerNodeData | ToolNodeData; // Add GuardrailData when defined

// --- Type guard example (optional but helpful) ---
// You might use these in the PropertiesPanel or code generator
export function isAgentNode(node: Node<NodeData>): node is Node<AgentNodeData> {
    return node.type === 'agent';
}

export function isRunnerNode(node: Node<NodeData>): node is Node<RunnerNodeData> {
    return node.type === 'runner';
}

export function isToolNode(node: Node<NodeData>): node is Node<ToolNodeData> {
    return node.type === 'tool';
}

// Add more type guards as needed 