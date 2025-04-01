import { Edge, Node } from 'reactflow';
import { AgentNodeData, NodeData, RunnerNodeData, ToolNodeData, Parameter, NodeType, MCPServerConfig, isAgentNode } from '../types';
import { CustomLLMProvider } from '../store/workflowStore';

// Helper to generate a safe Python variable name from a node ID or name
const getNodeVarName = (id: string, type: string, name?: string): string => {
    // Prefer name if available and valid, otherwise use ID
    // Replace invalid characters (including hyphens) with underscores
    const baseNameRaw = name && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name.replace(/-/g, '_')) ? name : id;
    const baseNameSanitized = baseNameRaw.replace(/[^a-zA-Z0-9_]/g, '_');
    // Ensure it starts with a letter or underscore if the original was invalid
    const finalBaseName = /^[a-zA-Z_]/.test(baseNameSanitized) ? baseNameSanitized : `_${baseNameSanitized}`;
    
    return `${type}_${finalBaseName}_${id.substring(0, 4)}`;
};

// Helper to format Python args (e.g., for MCPServerStdio or function calls)
const formatPythonList = (items: any[] | undefined): string => {
    if (!items || items.length === 0) return '[]';
    // Use JSON.stringify for each item to ensure proper escaping for Python syntax
    return `[${items.map(item => JSON.stringify(item)).join(', ')}]`;
};

// Helper to format parameters for the @function_tool decorator and function signature
const formatParameters = (parameters: Parameter[] | undefined): string => {
    if (!parameters || parameters.length === 0) {
        return '';
    }
    // Format for @function_tool: "param1: type, param2: type"
    // Also used for function signature: def func(param1: type, param2: type):
    return parameters.map(p => `${p.name}: ${p.type || 'Any'}`).join(', ');
};

// Generate the Python code
export const generateCode = (nodes: Node<NodeData>[], edges: Edge[], customLLMProviders: CustomLLMProvider[]): string => {
    // ---> 加入除錯資訊 <-----
    console.log("[generateCode] Received customLLMProviders:", JSON.stringify(customLLMProviders), "Is Array:", Array.isArray(customLLMProviders));
    // --- 結束除錯 ---

    let imports = new Set<string>([
        'import asyncio',
        'from typing import List, Dict, Any, Optional', // Add common types
        'from agents import Agent, Runner, function_tool',
        'from pydantic import BaseModel' // Keep pydantic import
    ]);
    let mcpServerDefs: string[] = [];
    let customProviderDefs: string[] = [];
    const agentVarNames: { [key: string]: string } = {};
    const toolVarNames: { [key: string]: string } = {};
    const mcpServerVarNames: { [key: string]: string } = {};
    const agentCustomProviderInfo: { [key: string]: { providerInstanceVarName: string } } = {};
    const generatedProviderInstances: { [key: string]: string } = {};
    let toolDefs: string[] = [];
    let agentDefs: string[] = [];
    let runnerDef = '';
    let mainFunction = '';
    let firstAgentVar: string | undefined = undefined;

    // --- 預先計算所有 Agent 的變數名 --- 
    const agentNodes = nodes.filter(isAgentNode); // <--- 保留這個宣告
    agentNodes.forEach(node => {
        const agentVar = getNodeVarName(node.id, 'agent', node.data.name);
        agentVarNames[node.id] = agentVar;
    });

    // --- 0. Process MCP Servers (defined within Agents) ---
    agentNodes.forEach(agentNode => { // <--- 使用 agentNodes
        if (agentNode.data.mcpServers && agentNode.data.mcpServers.length > 0) {
            agentNode.data.mcpServers.forEach(serverConfig => {
                // Avoid duplicate definitions if multiple agents use the same conceptual server
                // (though UI currently scopes them per-agent, generation assumes shared possibility)
                if (!mcpServerVarNames[serverConfig.id]) {
                    const serverVar = getNodeVarName(serverConfig.id, 'mcp', serverConfig.name); // Use name for readability
                    mcpServerVarNames[serverConfig.id] = serverVar;

                    if (serverConfig.type === 'stdio') {
                        imports.add('from agents.mcp import MCPServerStdio');
                        mcpServerDefs.push(
`${serverVar} = MCPServerStdio(
    params={
        "command": ${JSON.stringify(serverConfig.command || '')},
        "args": ${formatPythonList(serverConfig.args)},
    },
    cache_tools_list=${serverConfig.cacheToolsList ? 'True' : 'False'}
)`);
                    } else if (serverConfig.type === 'sse') {
                        imports.add('from agents.mcp import MCPServerSse');
                        mcpServerDefs.push(
`${serverVar} = MCPServerSse(
    url=${JSON.stringify(serverConfig.url || '')},
    cache_tools_list=${serverConfig.cacheToolsList ? 'True' : 'False'}
)`);
                    }
                }
            });
        }
    });

    // --- NEW: 0.5 Process Custom LLM Providers (Used by Agents) ---
    imports.add('from agents import ModelProvider, OpenAIChatCompletionsModel, RunConfig');
    agentNodes.forEach(node => { // <--- 使用 agentNodes
        if (node.data.customLLMProviderId) {
            const providerId = node.data.customLLMProviderId;
            const agentVar = agentVarNames[node.id]; // Get pre-calculated var name

            // ---> 加入檢查 agentVar 是否存在 <----
            if (!agentVar) {
                console.error(`Code Generator: Could not find variable name for agent node ${node.id}`);
                agentDefs.push(`# ERROR: Could not determine variable name for agent ${node.id}. Skipping provider config.`);
                return; // 跳過此節點
            }
            // --- 結束檢查 ---

            let providerInstanceVarName = generatedProviderInstances[providerId];

            // 如果這個 Provider ID 還沒有生成過對應的實例
            if (!providerInstanceVarName) {
                // 確保 customLLMProviders 存在並且是一個陣列
                if (customLLMProviders && Array.isArray(customLLMProviders)) {
                    const providerConfig = customLLMProviders.find(p => p.id === providerId);
                    if (providerConfig) {
                        imports.add('from openai import AsyncOpenAI'); // Import only if needed

                        // Generate unique names based on provider config
                        const baseName = getNodeVarName(providerConfig.id, 'provider', providerConfig.name);
                        const clientVarName = `client_${baseName}`;
                        const providerClassName = `CustomProvider_${baseName}`;
                        providerInstanceVarName = `instance_${baseName}`;

                        // Add definition code
                        customProviderDefs.push(
`# --- Custom Provider: ${providerConfig.name} ---
${clientVarName} = AsyncOpenAI(
    base_url=${JSON.stringify(providerConfig.baseURL)},
    api_key=${JSON.stringify(providerConfig.apiKey)}
)

class ${providerClassName}(ModelProvider):
    def get_model(self, model_name: str | None = None) -> OpenAIChatCompletionsModel:
        # Note: Ignoring model_name argument for now, using the one from config
        return OpenAIChatCompletionsModel(
            model=${JSON.stringify(providerConfig.modelName)},
            openai_client=${clientVarName}
        )

${providerInstanceVarName} = ${providerClassName}()
# -------
`);
                        generatedProviderInstances[providerId] = providerInstanceVarName; // Store for reuse
                    } else {
                        console.warn(`Custom LLM Provider config with ID ${providerId} not found for agent ${node.id}.`);
                        agentDefs.push(`# WARNING: Custom LLM Provider configuration (ID: ${providerId}) not found for agent ${agentVar}. Using default OpenAI settings.`);
                        delete agentCustomProviderInfo[agentVar]; // Ensure no stale info
                    }
                } else {
                    console.warn(`customLLMProviders array is missing or invalid. Using default OpenAI for agent ${node.id}.`);
                    // ---> 修正警告訊息中的變數 <----
                    agentDefs.push(`# WARNING: Custom LLM Providers data unavailable for agent ${agentVar || node.id}. Using default OpenAI settings.`);
                    delete agentCustomProviderInfo[agentVar]; // Ensure no stale info
                }
            }

            // If we successfully found/generated the instance, link it to the agent
            if (providerInstanceVarName) {
                 agentCustomProviderInfo[agentVar] = { providerInstanceVarName };
            } else {
                delete agentCustomProviderInfo[agentVar]; // Ensure no stale info if provider failed
            }
        } else {
            // Agent doesn't use a custom provider ID, ensure no stale info
            const agentVar = agentVarNames[node.id];
            if (agentVar) {
                 delete agentCustomProviderInfo[agentVar];
            }
        }
    });

    // --- 1. Process Tools --- 
    const toolNodes = nodes.filter((node): node is Node<ToolNodeData> => node.type === 'tool');
    toolNodes.forEach(node => {
        const toolName = node.data.name || getNodeVarName(node.id, 'tool'); 
        toolVarNames[node.id] = toolName;
        const paramsString = formatParameters(node.data.parameters);
        const returnType = node.data.returnType || 'Any';
        const implementationLines = (node.data.implementation || '    pass').split('\n');
        const indentedImplementation = implementationLines.map(line => `    ${line}`).join('\n');

        toolDefs.push(
`@function_tool(
    name="${toolName}", 
    description="",
    parameters="${paramsString}"
)
def ${toolName}(${paramsString}) -> ${returnType}:
${indentedImplementation}
`);
    });

    // --- 2. Process Agents --- 
    // --- Note: No need to filter agentNodes again ---
    // const agentNodes = nodes.filter(isAgentNode); // <--- 移除重複宣告

    // ---> 分離 Agent 節點 <----
    const agentsWithoutHandoffs: Node<AgentNodeData>[] = [];
    const agentsWithHandoffs: Node<AgentNodeData>[] = [];

    agentNodes.forEach(node => { // <--- 使用 agentNodes
        const handoffEdges = edges.filter(edge => edge.source === node.id && edge.sourceHandle === 'b-output');
        let hasHandoff = false;
        for (const edge of handoffEdges) {
             const targetNode = nodes.find(n => n.id === edge.target);
             if (targetNode && isAgentNode(targetNode)) {
                 hasHandoff = true;
                 break;
             }
        }
        if (hasHandoff) {
            agentsWithHandoffs.push(node);
        } else {
            agentsWithoutHandoffs.push(node);
        }
    });
    // --- 結束分離 ---

    // ---> 先生成沒有 Handoff 的 Agent <----
    agentsWithoutHandoffs.forEach(node => {
        const agentVar = agentVarNames[node.id];
        const agentName = node.data.name || 'Unnamed Agent';
        const instructions = node.data.instructions || '';
        const formattedInstructions = JSON.stringify(instructions).slice(1, -1);
        const connectedToolIds = edges
            .filter(edge => edge.target === node.id && edge.targetHandle === 'c-tools')
            .map(edge => edge.source);
        const toolListString = connectedToolIds
            .map(toolId => toolVarNames[toolId])
            .filter(name => !!name)
            .join(', ') || '';
        const handoffListString = ''; 
        const mcpServerListString = (node.data.mcpServers || [])
            .map(serverConfig => mcpServerVarNames[serverConfig.id])
            .filter(name => !!name)
            .join(', ');
        let agentParams = [
            `name=${JSON.stringify(agentName)}`,
            `instructions=(\n        \"\"\"\n${formattedInstructions}\n        \"\"\"\n    )`,
            `tools=[${toolListString}]`,
            `handoffs=[${handoffListString}]`,
            `mcp_servers=[${mcpServerListString}]`,
        ];
        if (!agentCustomProviderInfo[agentVar]) {
            agentParams.push(`modelName=${node.data.modelName ? JSON.stringify(node.data.modelName) : '"gpt-4o"'}`);
            agentParams.push(`temperature=${node.data.temperature ?? 0.7}`);
        }
        agentDefs.push(
`${agentVar} = Agent(
    ${agentParams.join(',\n    ')}
)
`);
    });
    // --- 結束生成無 Handoff Agent ---

    // ---> 再生成有 Handoff 的 Agent <----
    agentsWithHandoffs.forEach(node => {
        const agentVar = agentVarNames[node.id];
        const agentName = node.data.name || 'Unnamed Agent';
        const instructions = node.data.instructions || '';
        const formattedInstructions = JSON.stringify(instructions).slice(1, -1);
        const connectedToolIds = edges
            .filter(edge => edge.target === node.id && edge.targetHandle === 'c-tools')
            .map(edge => edge.source);
        const toolListString = connectedToolIds
            .map(toolId => toolVarNames[toolId])
            .filter(name => !!name)
            .join(', ') || '';
        const handoffTargetNodes = edges
            .filter(edge => edge.source === node.id && edge.sourceHandle === 'b-output')
            .map(edge => nodes.find(n => n.id === edge.target))
            .filter((targetNode): targetNode is Node<AgentNodeData> => !!targetNode && isAgentNode(targetNode));
        const handoffListString = handoffTargetNodes
            .map(targetNode => agentVarNames[targetNode.id]) 
            .filter(name => !!name)
            .join(', ') || '';
        if (handoffListString) imports.add('from agents import handoff');
        const mcpServerListString = (node.data.mcpServers || [])
            .map(serverConfig => mcpServerVarNames[serverConfig.id])
            .filter(name => !!name)
            .join(', ');
        let agentParams = [
            `name=${JSON.stringify(agentName)}`,
            `instructions=(\n        \"\"\"\n${formattedInstructions}\n        \"\"\"\n    )`,
            `tools=[${toolListString}]`,
            `handoffs=[${handoffListString}]`,
            `mcp_servers=[${mcpServerListString}]`,
        ];
        if (!agentCustomProviderInfo[agentVar]) {
            agentParams.push(`modelName=${node.data.modelName ? JSON.stringify(node.data.modelName) : '"gpt-4o"'}`);
            agentParams.push(`temperature=${node.data.temperature ?? 0.7}`);
        }
        agentDefs.push(
`${agentVar} = Agent(
    ${agentParams.join(',\n    ')}
)
`);
    });
    // --- 結束生成有 Handoff Agent ---

    // --- 3. Process Runner --- 
    const runnerNode = nodes.find((node): node is Node<RunnerNodeData> => node.type === 'runner');

    if (runnerNode) {
        // Find the first agent connected to the runner's input
        const inputEdge = edges.find(edge => edge.target === runnerNode.id && edge.targetHandle === 'a-input');
        if (inputEdge) {
            const sourceNode = nodes.find(node => node.id === inputEdge.source);
            if (sourceNode && isAgentNode(sourceNode)) {
                firstAgentVar = agentVarNames[sourceNode.id];
            }
        }

        if (firstAgentVar) {
            // No need to instantiate Runner, just ensure the class is imported
            imports.add('from agents import Runner');
            // Ensure RunConfig is imported if we might use it
            if (Object.keys(agentCustomProviderInfo).length > 0) {
                imports.add('from agents import RunConfig');
            }

            const runnerMode = runnerNode.data.mode || 'sync'; // Default to sync
            const runnerInput = runnerNode.data.input || '';
            const executionMode = runnerNode.data.executionMode || 'run'; // Default to 'run'

            // ---> Runner Definition (Removed instantiation) <---
            runnerDef = ''; // Clear runnerDef if agent is found

            // ---> Determine RunConfig argument <---
            let runConfigArg = '';
            const customProvider = agentCustomProviderInfo[firstAgentVar];
            if (customProvider) {
                runConfigArg = `, run_config=RunConfig(model_provider=${customProvider.providerInstanceVarName})`;
            }
            // --- End RunConfig --- 

            // --- Determine if async main is needed (stream, async mode, or MCP servers) ---
            const hasMcpServers = Object.keys(mcpServerVarNames).length > 0;
            const needsAsyncMain = executionMode === 'stream' || runnerMode === 'async' || hasMcpServers;
            if (needsAsyncMain) {
                imports.add('import asyncio');
            }

            // --- Generate MCP async with context string if needed ---
            let mcpAsyncWithStart = '';
            let mcpAsyncWithEnd = '';
            if (hasMcpServers) {
                const mcpVars = Object.values(mcpServerVarNames).join(', ');
                mcpAsyncWithStart = `    async with ${mcpVars}:\n        print("MCP Server(s) connected.") # Optional log\n`;
                mcpAsyncWithEnd = `    print("MCP Server(s) stopped.") # Optional log\n`;
            }
            const runnerCallIndent = hasMcpServers ? '        ' : '    '; // Indent Runner call if inside async with

            // --- Main Function Generation --- 
            if (executionMode === 'stream') {
                // Stream mode always needs async main
                imports.add('from agents import ItemHelpers'); 
                imports.add('from openai.types.responses import ResponseTextDeltaEvent'); 

                mainFunction = `
async def main():
${mcpAsyncWithStart}${runnerCallIndent}print("=== Run starting (stream) ===")
${runnerCallIndent}result = Runner.run_streamed(
${runnerCallIndent}    ${firstAgentVar}, 
${runnerCallIndent}    input=${JSON.stringify(runnerInput)}${runConfigArg}
${runnerCallIndent})
${runnerCallIndent}async for event in result.stream_events():
${runnerCallIndent}    # Handle different event types based on SDK documentation
${runnerCallIndent}    if event.type == "raw_response_event":
${runnerCallIndent}        if isinstance(event.data, ResponseTextDeltaEvent):
${runnerCallIndent}            print(event.data.delta, end="", flush=True)
${runnerCallIndent}    elif event.type == "agent_updated_stream_event":
${runnerCallIndent}        print(f"\\nAgent updated: {event.new_agent.name}")
${runnerCallIndent}    elif event.type == "run_item_stream_event":
${runnerCallIndent}        if event.item.type == "tool_call_item":
${runnerCallIndent}            print("\\n-- Tool was called")
${runnerCallIndent}        elif event.item.type == "tool_call_output_item":
${runnerCallIndent}            print(f"\\n-- Tool output: {event.item.output}")
${runnerCallIndent}        elif event.item.type == "message_output_item":
${runnerCallIndent}            print(f"\\n-- Message output:\\n{ItemHelpers.text_message_output(event.item)}")
${runnerCallIndent}print("\\n=== Run complete ===")
${mcpAsyncWithEnd}
if __name__ == "__main__":
    asyncio.run(main())
`;
            } else { // 'run' mode
                if (needsAsyncMain) { // Async run mode OR Sync mode with MCP
                    const runCall = runnerMode === 'async' 
                        ? `await Runner.run(${firstAgentVar}, input=${JSON.stringify(runnerInput)}${runConfigArg})`
                        : `await asyncio.to_thread(Runner.run_sync, ${firstAgentVar}, input=${JSON.stringify(runnerInput)}${runConfigArg})`; // Use to_thread for sync run inside async main

                    mainFunction = `
async def main():
${mcpAsyncWithStart}${runnerCallIndent}print("=== Run starting (async run or sync run with MCP) ===")
${runnerCallIndent}result = ${runCall}
${runnerCallIndent}print(result.final_output)
${mcpAsyncWithEnd}
if __name__ == "__main__":
    asyncio.run(main())
`;
                } else { // Sync run mode WITHOUT MCP servers (true sync)
                    mainFunction = `
def main():
    # No MCP servers, so no async with needed
    print("=== Run starting (sync run) ===")
    result = Runner.run_sync(${firstAgentVar}, input=${JSON.stringify(runnerInput)}${runConfigArg})
    print(result.final_output)

if __name__ == "__main__":
    main()
`;
                }
            }
        } else {
            runnerDef = `# ERROR: Runner node (${runnerNode.id}) is not connected to a starting Agent.`;
        }
    } else {
        runnerDef = '# INFO: No Runner node found in the diagram.';
    }

    // --- Combine all parts (remove separate asyncio check, handled above) ---
    // if (mainFunction.includes('async def main()') || mainFunction.includes('asyncio.run')) {
    //      imports.add('import asyncio');
    // }

    const sortedImports = Array.from(imports).sort((a, b) => {
        if (a.includes('import asyncio') && !b.includes('import asyncio')) {
            return -1;
        } else if (!a.includes('import asyncio') && b.includes('import asyncio')) {
            return 1;
        }
        return a.localeCompare(b);
    }).join('\n');

    // --- 4. Combine Code --- 
    const finalCode = [
        sortedImports,
        ...(mcpServerDefs.length > 0 ? ['', '# --- MCP Server Definitions ---', ...mcpServerDefs] : []), // Conditionally add MCP section
        ...(customProviderDefs.length > 0 ? ['', '# --- Custom LLM Provider Definitions ---', customProviderDefs.join('\n')] : []),
        '\n# --- Tool Definitions ---',
        toolDefs.join('\n\n'),
        '\n# --- Agent Definitions ---',
        agentDefs.join('\n\n'),
        '\n# --- Runner Execution ---',
        runnerDef,
        mainFunction
    ].filter(Boolean).join('\n\n'); // Filter Boolean removes empty strings potentially left by conditional sections

    return finalCode;
}; 