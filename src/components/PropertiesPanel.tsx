'use client';

import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import useWorkflowStore, { RFState } from '../store/workflowStore';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  SelectSeparator, SelectLabel, SelectGroup
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AgentNodeData, RunnerNodeData, ToolNodeData, NodeData, Parameter, isAgentNode, isRunnerNode, isToolNode, MCPServerConfig } from '../types';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Info, X, Server, Pencil } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { generateCode as generateCodeFunc } from '../lib/codeGenerator';

// Helper component for Agent Properties
const AgentPropertiesForm = ({ nodeId, data, updateNodeData }: { nodeId: string, data: AgentNodeData, updateNodeData: RFState['updateNodeData'] }) => {
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [showPydanticField, setShowPydanticField] = useState<boolean>(data.output_type === 'pydantic');
  const [currentMcpServer, setCurrentMcpServer] = useState<Partial<MCPServerConfig> | null>(null);
  const [mcpServerArgs, setMcpServerArgs] = useState<string>('');

  // ---> 新增：取得自訂 LLM Provider 列表 <---
  const { customLLMProviders } = useWorkflowStore();
  // --- 結束新增 ---

  // Update local state if node data changes externally
  useEffect(() => {
    setShowPydanticField(data.output_type === 'pydantic');
  }, [data.output_type]);

  const handleOutputTypeChange = (value: string) => {
    updateNodeData(nodeId, { output_type: value });
  };

  // ---> 新增：處理模型選擇變更的函式 <---
  const handleModelChange = (selectedValue: string) => {
    if (selectedValue.startsWith('custom_')) {
        const providerId = selectedValue.replace('custom_', '');
        const selectedProvider = customLLMProviders.find(p => p.id === providerId);
        if (selectedProvider) {
            updateNodeData(nodeId, {
                modelName: selectedProvider.modelName, // 使用自訂提供者的模型名稱
                customLLMProviderId: providerId
            });
        }
    } else {
        // 選擇了預設 OpenAI 模型
        updateNodeData(nodeId, {
            modelName: selectedValue,
            customLLMProviderId: null // 清除自訂提供者 ID
        });
    }
  };
  // --- 結束新增 ---

  const openMcpDialog = (server?: MCPServerConfig) => {
    if (server) {
      setCurrentMcpServer({ ...server });
      setMcpServerArgs(server.args?.join(' ') || '');
    } else {
      setCurrentMcpServer({
        id: `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: '',
        type: 'stdio',
        cacheToolsList: false,
        command: '',
        args: [],
        url: ''
      });
      setMcpServerArgs('');
    }
  };

  const handleMcpServerChange = (field: keyof MCPServerConfig, value: any) => {
    setCurrentMcpServer((prev: Partial<MCPServerConfig> | null) => prev ? { ...prev, [field]: value } : null);
    if (field === 'args') {
      try {
        const argsArray = mcpServerArgs.split(' ').filter(arg => arg.trim() !== '');
        setCurrentMcpServer((prev: Partial<MCPServerConfig> | null) => prev ? { ...prev, args: argsArray } : null);
      } catch (e) {
        console.error("Error parsing args:", e);
      }
    }
  };

  const handleArgsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const argsString = e.target.value;
    setMcpServerArgs(argsString);
    const argsArray = argsString.split(' ').filter(arg => arg.trim() !== '');
    setCurrentMcpServer((prev: Partial<MCPServerConfig> | null) => prev ? { ...prev, args: argsArray } : null);
  };

  const saveMcpServer = () => {
    if (!currentMcpServer || !currentMcpServer.name || !currentMcpServer.id) return;

    const existingServers = data.mcpServers || [];
    const serverIndex = existingServers.findIndex((s: MCPServerConfig) => s.id === currentMcpServer.id);

    let updatedServers;
    if (serverIndex > -1) {
      updatedServers = [...existingServers];
      updatedServers[serverIndex] = currentMcpServer as MCPServerConfig;
    } else {
      updatedServers = [...existingServers, currentMcpServer as MCPServerConfig];
    }

    updateNodeData(nodeId, { mcpServers: updatedServers });
    setCurrentMcpServer(null);
    setMcpServerArgs('');
  };

  const deleteMcpServer = (serverId: string) => {
    const updatedServers = (data.mcpServers || []).filter((s: MCPServerConfig) => s.id !== serverId);
    updateNodeData(nodeId, { mcpServers: updatedServers });
  };

  // ---> 新增：決定 Select 元件顯示值的輔助變數 <---
  const selectedModelValue = data.customLLMProviderId
    ? `custom_${data.customLLMProviderId}`
    : data.modelName || 'gpt-4o'; // 如果都沒有，預設 gpt-4o
  // --- 結束新增 ---

  return (
    <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full grid grid-cols-2 mb-6">
        <TabsTrigger value="basic" className="text-sm py-2">基本設定</TabsTrigger>
        <TabsTrigger value="advanced" className="text-sm py-2">進階設定</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="mt-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor={`agent-${nodeId}-name`} className="text-sm font-medium mb-2 block">名稱</Label>
            <Input
              id={`agent-${nodeId}-name`}
              value={data.name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeData(nodeId, { name: e.target.value })}
              className="w-full input-enhanced"
              placeholder="Agent 名稱 (唯一識別符)"
            />
          </div>
          <div>
            <Label htmlFor={`agent-${nodeId}-instructions`} className="text-sm font-medium mb-2 block">指令</Label>
            <Textarea
              id={`agent-${nodeId}-instructions`}
              value={data.instructions || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateNodeData(nodeId, { instructions: e.target.value })}
              className="min-h-[120px] w-full input-enhanced"
              placeholder="描述 Agent 的目的和角色..."
            />
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="advanced" className="mt-2">
        <div className="space-y-6">
          <div className="space-y-4 border-b border-gray-200 pb-6">
             <div>
               <div className="flex items-center justify-between mb-2">
                 <Label htmlFor={`agent-${nodeId}-output_type`} className="text-sm font-medium">
                   輸出類型
                 </Label>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-6 w-6">
                       <Info className="h-4 w-4" />
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent side="left" className="w-80">
                     <div className="space-y-2">
                       <h4 className="font-medium text-sm">輸出類型說明</h4>
                       <p className="text-sm text-muted-foreground">
                         <strong>None</strong>: Agent 不需要結構化輸出<br/>
                         <strong>Pydantic</strong>: 使用 Pydantic 模型來規範輸出結構
                       </p>
                     </div>
                   </PopoverContent>
                 </Popover>
               </div>
               <Select
                 value={data.output_type || 'none'}
                 onValueChange={handleOutputTypeChange}
               >
                 <SelectTrigger id={`agent-${nodeId}-output_type`} className="w-full input-enhanced">
                   <SelectValue placeholder="選擇輸出類型" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">None</SelectItem>
                   <SelectItem value="pydantic">Pydantic 模型</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             {showPydanticField && (
               <div className="mt-3">
                 <Label htmlFor={`agent-${nodeId}-pydantic_model_name`} className="text-sm font-medium mb-2 block">Pydantic 模型名稱</Label>
                 <Input
                   id={`agent-${nodeId}-pydantic_model_name`}
                   value={data.pydantic_model_name || ''}
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeData(nodeId, { pydantic_model_name: e.target.value })}
                   className="w-full input-enhanced"
                   placeholder="MyOutputModel"
                 />
               </div>
             )}
             
             <div className="mt-3">
               <Label htmlFor={`agent-${nodeId}-model_name`} className="text-sm font-medium mb-2 block">模型</Label>
               <Select
                 value={selectedModelValue}
                 onValueChange={handleModelChange}
               >
                 <SelectTrigger id={`agent-${nodeId}-model_name`} className="w-full input-enhanced">
                   <SelectValue placeholder="選擇模型或自訂提供者" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectGroup>
                     <SelectLabel>OpenAI</SelectLabel>
                     <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                     <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                     <SelectItem value="gpt-4">GPT-4</SelectItem>
                     <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                   </SelectGroup>
                   
                   {customLLMProviders.length > 0 && (
                     <>
                       <SelectSeparator />
                       <SelectGroup>
                         <SelectLabel>自訂提供者</SelectLabel>
                         {customLLMProviders.map((provider) => (
                           <SelectItem key={provider.id} value={`custom_${provider.id}`}>
                             {provider.name} ({provider.modelName})
                           </SelectItem>
                         ))}
                       </SelectGroup>
                     </>
                   )}
                 </SelectContent>
               </Select>
             </div>
             
             <div className="mt-3">
               <Label htmlFor={`agent-${nodeId}-temperature`} className="text-sm font-medium mb-2 block">溫度</Label>
               <div className="flex items-center gap-3">
                 <Input
                   id={`agent-${nodeId}-temperature`}
                   type="number"
                   min="0"
                   max="1"
                   step="0.1"
                   value={data.temperature?.toString() ?? '0.7'} 
                   onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                       const value = parseFloat(e.target.value);
                       updateNodeData(nodeId, { temperature: isNaN(value) ? undefined : value });
                    }}
                   className="w-24 input-enhanced"
                 />
                 <span className="text-sm text-muted-foreground">0 (精確) 到 1 (創意)</span>
               </div>
             </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-500" />
                <Label className="text-sm font-medium">MCP 伺服器</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mt-0.5">
                      <Info className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="right" className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">MCP 伺服器說明</h4>
                      <p className="text-sm text-muted-foreground">
                        此處配置允許 Agent 連接並控制外部多控制器協議 (MCP) 伺服器以執行特定任務。
                        選擇 'stdio' 使用標準輸入/輸出與本地進程通信，或 'sse' 使用 Server-Sent Events 連接到 URL。
                      </p>
                     </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Dialog onOpenChange={(isOpen) => !isOpen && setCurrentMcpServer(null)}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => openMcpDialog()}> <Plus className="h-4 w-4 mr-1" /> 新增伺服器 </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                   <DialogHeader>
                     <DialogTitle>{currentMcpServer && currentMcpServer.name ? `編輯 ${currentMcpServer.name}` : '新增 MCP 伺服器配置'}</DialogTitle>
                     <DialogDescription>配置 Agent 如何與 MCP 伺服器互動。</DialogDescription>
                   </DialogHeader>
                   {currentMcpServer && (
                    <div className="grid gap-4 py-4">
                       <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="mcp-name" className="text-right">名稱</Label>
                         <Input id="mcp-name" value={currentMcpServer.name || ''} onChange={(e) => handleMcpServerChange('name', e.target.value)} className="col-span-3" placeholder="伺服器識別名稱"/>
                       </div>
                       <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="mcp-type" className="text-right">類型</Label>
                         <Select value={currentMcpServer.type || 'stdio'} onValueChange={(v) => handleMcpServerChange('type', v)}>
                           <SelectTrigger id="mcp-type" className="col-span-3">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="stdio">stdio</SelectItem>
                             <SelectItem value="sse">sse</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       {currentMcpServer.type === 'stdio' && (
                         <>
                           <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="mcp-command" className="text-right">指令</Label>
                             <Input id="mcp-command" value={currentMcpServer.command || ''} onChange={(e) => handleMcpServerChange('command', e.target.value)} className="col-span-3" placeholder="例如：python mcp_server.py"/>
                           </div>
                           <div className="grid grid-cols-4 items-center gap-4">
                             <Label htmlFor="mcp-args" className="text-right">參數</Label>
                             <Input id="mcp-args" value={mcpServerArgs} onChange={handleArgsInputChange} className="col-span-3" placeholder="以空格分隔的參數"/>
                           </div>
                         </>
                       )}
                       {currentMcpServer.type === 'sse' && (
                         <div className="grid grid-cols-4 items-center gap-4">
                           <Label htmlFor="mcp-url" className="text-right">URL</Label>
                           <Input id="mcp-url" value={currentMcpServer.url || ''} onChange={(e) => handleMcpServerChange('url', e.target.value)} className="col-span-3" placeholder="例如：http://localhost:8000/events"/>
                         </div>
                       )}
                      <div className="flex items-center space-x-2 mt-2 pl-1 col-start-2 col-span-3">
                        <Checkbox id="mcp-cache" checked={currentMcpServer.cacheToolsList} onCheckedChange={(checked) => handleMcpServerChange('cacheToolsList', checked)} />
                        <Label htmlFor="mcp-cache" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          快取工具列表
                        </Label>
                       </div>
                     </div>
                   )}
                   <DialogFooter>
                     <DialogClose asChild>
                       <Button type="button" variant="secondary">取消</Button>
                     </DialogClose>
                     <Button type="button" onClick={() => { saveMcpServer(); (document.querySelector('[data-state="open"] [aria-label="Close"]') as HTMLElement)?.click(); }}>儲存</Button>
                   </DialogFooter>
                 </DialogContent>
               </Dialog>
            </div>

            {(data.mcpServers && data.mcpServers.length > 0) && (
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>名稱</TableHead>
                      <TableHead>類型</TableHead>
                      <TableHead>詳細資料</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.mcpServers.map((server) => (
                      <TableRow key={server.id}>
                        <TableCell className="font-medium">{server.name}</TableCell>
                        <TableCell>{server.type}</TableCell>
                        <TableCell className="text-xs">{server.type === 'stdio' ? server.command : server.url}</TableCell>
                        <TableCell className="text-right">
                           <Dialog onOpenChange={(isOpen) => !isOpen && setCurrentMcpServer(null)}>
                             <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => openMcpDialog(server)}><Pencil className="h-4 w-4" /></Button>
                             </DialogTrigger>
                             <DialogContent className="sm:max-w-[525px]">
                                <DialogHeader>
                                  <DialogTitle>{currentMcpServer && currentMcpServer.name ? `編輯 ${currentMcpServer.name}` : '編輯 MCP 伺服器配置'}</DialogTitle>
                                </DialogHeader>
                                {currentMcpServer && (
                                  <div className="grid gap-4 py-4"> 
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="mcp-edit-name" className="text-right">名稱</Label>
                                      <Input id="mcp-edit-name" value={currentMcpServer.name || ''} onChange={(e) => handleMcpServerChange('name', e.target.value)} className="col-span-3"/>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="mcp-edit-type" className="text-right">類型</Label>
                                      <Select value={currentMcpServer.type || 'stdio'} onValueChange={(v) => handleMcpServerChange('type', v)}>
                                        <SelectTrigger id="mcp-edit-type" className="col-span-3">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="stdio">stdio</SelectItem>
                                          <SelectItem value="sse">sse</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {currentMcpServer.type === 'stdio' && (
                                      <>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label htmlFor="mcp-edit-command" className="text-right">指令</Label>
                                          <Input id="mcp-edit-command" value={currentMcpServer.command || ''} onChange={(e) => handleMcpServerChange('command', e.target.value)} className="col-span-3" />
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                          <Label htmlFor="mcp-edit-args" className="text-right">參數</Label>
                                          <Input id="mcp-edit-args" value={mcpServerArgs} onChange={handleArgsInputChange} className="col-span-3" />
                                        </div>
                                      </>
                                    )}
                                    {currentMcpServer.type === 'sse' && (
                                      <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="mcp-edit-url" className="text-right">URL</Label>
                                        <Input id="mcp-edit-url" value={currentMcpServer.url || ''} onChange={(e) => handleMcpServerChange('url', e.target.value)} className="col-span-3" />
                                      </div>
                                    )}
                                    <div className="flex items-center space-x-2 mt-2 pl-1 col-start-2 col-span-3">
                                      <Checkbox id="mcp-edit-cache" checked={currentMcpServer.cacheToolsList} onCheckedChange={(checked) => handleMcpServerChange('cacheToolsList', checked)} />
                                      <Label htmlFor="mcp-edit-cache" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        快取工具列表
                                      </Label>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button type="button" variant="secondary">取消</Button>
                                  </DialogClose>
                                  <Button type="button" onClick={() => { saveMcpServer(); (document.querySelector('[data-state="open"] [aria-label="Close"]') as HTMLElement)?.click(); }}>儲存變更</Button>
                                </DialogFooter>
                             </DialogContent>
                           </Dialog>
                          <Button variant="ghost" size="icon" onClick={() => deleteMcpServer(server.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
          </div>
          
        </div>
      </TabsContent>
    </Tabs>
  );
};

// Helper component for Runner Properties
const RunnerPropertiesForm = ({ nodeId, data, updateNodeData }: { nodeId: string, data: RunnerNodeData, updateNodeData: RFState['updateNodeData'] }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`runner-${nodeId}-mode`} className="text-sm font-medium mb-2 block">內部執行模式</Label>
        <Select
          value={data.mode || 'sync'}
          onValueChange={(value: 'sync' | 'async') => updateNodeData(nodeId, { mode: value })}
        >
          <SelectTrigger id={`runner-${nodeId}-mode`} className="w-full input-enhanced">
            <SelectValue placeholder="選擇內部執行模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sync">同步 (sync)</SelectItem>
            <SelectItem value="async">非同步 (async)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1.5">
          Agent 內部執行的模式 (影響是否使用 `asyncio.to_thread`)。
        </p>
      </div>
      <div>
        <Label htmlFor={`runner-${nodeId}-executionMode`} className="text-sm font-medium mb-2 block">生成程式碼模式</Label>
        <Select
          value={data.executionMode || 'run'}
          onValueChange={(value: 'run' | 'stream') => updateNodeData(nodeId, { executionMode: value })}
        >
          <SelectTrigger id={`runner-${nodeId}-executionMode`} className="w-full input-enhanced">
            <SelectValue placeholder="選擇生成程式碼模式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="run">執行 (run)</SelectItem>
            <SelectItem value="stream">串流 (stream)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1.5">
          決定生成的程式碼使用 runner.run() 或 runner.stream() 方法。
        </p>
      </div>
      <div>
        <Label htmlFor={`runner-${nodeId}-input`} className="text-sm font-medium mb-2 block">初始輸入</Label>
        <Textarea
          id={`runner-${nodeId}-input`}
          value={data.input || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateNodeData(nodeId, { input: e.target.value })}
          className="min-h-[100px] w-full input-enhanced"
          placeholder="提供給第一個 Agent 的初始輸入..."
        />
      </div>
    </div>
  );
};

// Improved Tool Properties Form with Parameter Table
const ToolPropertiesForm = ({ nodeId, data, updateNodeData }: { nodeId: string, data: ToolNodeData, updateNodeData: RFState['updateNodeData'] }) => {
  const [parameters, setParameters] = useState<Parameter[]>(data.parameters || []);
  const [newParamName, setNewParamName] = useState('');
  const [newParamType, setNewParamType] = useState('str');
  const [activeTab, setActiveTab] = useState<string>("basic");
  
  // Update local state if node data changes externally
  useEffect(() => {
    setParameters(data.parameters || []);
  }, [data.parameters]);

  const addParameter = () => {
    if (!newParamName.trim()) return;
    const newParams = [...parameters, { name: newParamName, type: newParamType }];
    // No need to call setParameters here, useEffect will handle it when data.parameters updates
    updateNodeData(nodeId, { parameters: newParams }); 
    setNewParamName('');
    setNewParamType('str');
  };
  
  const removeParameter = (index: number) => {
    const newParams = [...parameters];
    newParams.splice(index, 1);
    // No need to call setParameters here, useEffect will handle it when data.parameters updates
    updateNodeData(nodeId, { parameters: newParams });
  };
  
  const returnTypeOptions = [
    'str', 'int', 'float', 'bool', 'list', 'dict', 'None' 
  ];

  return (
    <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full grid grid-cols-2 mb-6">
        <TabsTrigger value="basic" className="text-sm py-2">基本設定</TabsTrigger>
        <TabsTrigger value="implementation" className="text-sm py-2">實作程式碼</TabsTrigger>
      </TabsList>
      
      <TabsContent value="basic" className="mt-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor={`tool-${nodeId}-name`} className="text-sm font-medium mb-2 block">函數名稱</Label>
            <Input
              id={`tool-${nodeId}-name`}
              value={data.name || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateNodeData(nodeId, { name: e.target.value })}
              className="w-full input-enhanced"
               placeholder="工具函數的 Python 名稱"
            />
          </div>
          <div>
            <Label htmlFor={`tool-${nodeId}-returnType`} className="text-sm font-medium mb-2 block">回傳類型</Label>
             <Select
                value={data.returnType || 'str'}
                onValueChange={(value: string) => updateNodeData(nodeId, { returnType: value })}
              >
                <SelectTrigger id={`tool-${nodeId}-returnType`} className="w-full input-enhanced">
                  <SelectValue placeholder="選擇回傳類型" />
                </SelectTrigger>
                <SelectContent>
                  {returnTypeOptions.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>

          {/* Parameters Table */}
          <div className="space-y-3 mt-4">
             <Label className="text-sm font-medium block">參數</Label>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">名稱</TableHead>
                    <TableHead className="w-[40%]">類型</TableHead>
                    <TableHead className="w-[20%] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.length > 0 ? (
                    parameters.map((param, index) => (
                      <TableRow key={`${nodeId}-param-${index}`}> {/* Ensure unique key */}
                        <TableCell className="font-medium py-2">{param.name}</TableCell>
                        <TableCell className="py-2">{param.type}</TableCell>
                        <TableCell className="text-right py-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeParameter(index)}>
                             <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-4">無參數</TableCell>
                    </TableRow>
                  )}
                </TableBody>
             </Table>
             {/* Add Parameter Form */}
             <div className="flex items-end gap-2 pt-2">
                <div className="flex-1">
                  <Label htmlFor={`tool-${nodeId}-newParamName`} className="text-xs font-medium mb-1 block">新參數名稱</Label>
                   <Input
                      id={`tool-${nodeId}-newParamName`}
                      value={newParamName}
                      onChange={(e) => setNewParamName(e.target.value)}
                      placeholder="e.g., user_query"
                      className="input-enhanced h-9"
                   />
                </div>
                <div className="w-28">
                   <Label htmlFor={`tool-${nodeId}-newParamType`} className="text-xs font-medium mb-1 block">類型</Label>
                   <Select value={newParamType} onValueChange={setNewParamType}>
                      <SelectTrigger id={`tool-${nodeId}-newParamType`} className="input-enhanced h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {returnTypeOptions.filter(t => t !== 'None').map(type => ( 
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                         <SelectItem value="Any">Any</SelectItem> 
                      </SelectContent>
                    </Select>
                </div>
                <Button onClick={addParameter} size="sm" className="h-9">
                   <Plus className="h-4 w-4 mr-1" /> 新增
                </Button>
             </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="implementation" className="mt-2">
         <div className="space-y-2">
          <Label htmlFor={`tool-${nodeId}-implementation`} className="text-sm font-medium mb-2 block">實作程式碼 (Python)</Label>
           <Textarea
            id={`tool-${nodeId}-implementation`}
            value={data.implementation || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateNodeData(nodeId, { implementation: e.target.value })}
            className="min-h-[200px] w-full font-mono text-sm input-enhanced"
            placeholder={`def execute(${parameters.map(p => p.name).join(', ') || '**kwargs'}):\n    # Your Python code here\n    pass`}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
};

function PropertiesPanel() {
  const { nodes, selectedNodeId, updateNodeData, setSelectedNodeId, customLLMProviders } = useWorkflowStore();

  const selectedNode = React.useMemo(() => 
      nodes.find((n) => n.id === selectedNodeId), 
      [nodes, selectedNodeId]
  );

  const handleClose = () => {
    setSelectedNodeId(null);
  };

  const handleGenerateCode = () => {
    const currentNodes = useWorkflowStore.getState().nodes;
    const currentEdges = useWorkflowStore.getState().edges;
    const currentProviders = useWorkflowStore.getState().customLLMProviders;

    console.log("[PropertiesPanel] Providers from store:", JSON.stringify(currentProviders));
    const providersToPass = currentProviders || [];
    console.log("[PropertiesPanel] Providers to pass:", JSON.stringify(providersToPass), "Is Array:", Array.isArray(providersToPass));
    
    try {
        const code = generateCodeFunc(currentNodes, currentEdges, providersToPass);
        console.log("Generated Code:\n", code);
        navigator.clipboard.writeText(code).then(() => {
            alert('程式碼已複製到剪貼簿！');
        }).catch(err => {
            console.error('複製程式碼失敗: ', err);
            alert('複製程式碼失敗。請查看控制台錯誤訊息。');
        });
    } catch (error) {
        console.error("生成程式碼時發生錯誤:", error);
        alert('生成程式碼時發生錯誤。請查看控制台錯誤訊息。');
    }
 };

  if (!selectedNodeId) {
    return (
      <div className="w-96 bg-card border-l border-border p-6 flex flex-col justify-center items-center text-muted-foreground italic">
        <p className="text-center">選擇一個節點以編輯其屬性</p>
      </div>
    );
  }
  if (!selectedNode) {
     return (
      <div className="w-96 bg-card border-l border-border p-6 flex flex-col justify-center items-center text-muted-foreground italic">
        <p className="text-center">正在載入節點...</p> 
      </div>
    );
  }

  const renderNodeProperties = () => {
    if (isAgentNode(selectedNode)) {
      return <AgentPropertiesForm nodeId={selectedNode.id} data={selectedNode.data} updateNodeData={updateNodeData} />;
    } else if (isRunnerNode(selectedNode)) {
      return <RunnerPropertiesForm nodeId={selectedNode.id} data={selectedNode.data} updateNodeData={updateNodeData} />;
    } else if (isToolNode(selectedNode)) {
      return <ToolPropertiesForm nodeId={selectedNode.id} data={selectedNode.data} updateNodeData={updateNodeData} />;
    } 
    else {
      return <p className="text-muted-foreground">不支援的節點類型或無屬性可編輯 ({selectedNode.type})。</p>;
    }
  };

  return (
    <aside className="w-96 bg-card border-l border-border flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">節點屬性 ({selectedNode.type})</h2>
         <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="flex-grow p-6"> 
        {renderNodeProperties()}
      </ScrollArea>
      <div className="p-4 border-t border-border mt-auto">
         <Button onClick={handleGenerateCode} className="w-full">生成程式碼</Button>
      </div>
    </aside>
  );
}

export default PropertiesPanel; 