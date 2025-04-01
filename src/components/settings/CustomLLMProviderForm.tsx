import React, { useState, useEffect } from 'react';
import { CustomLLMProvider } from '../../store/workflowStore'; // 確保路徑正確
import { Button } from '@/components/ui/button'; // 假設使用 shadcn/ui
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface CustomLLMProviderFormProps {
  provider?: CustomLLMProvider | null; // 傳入 provider 表示編輯模式
  onSave: (providerData: Omit<CustomLLMProvider, 'id'> | CustomLLMProvider) => void;
  onCancel: () => void;
}

const CustomLLMProviderForm: React.FC<CustomLLMProviderFormProps> = ({ provider, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');

  useEffect(() => {
    if (provider) {
      setName(provider.name);
      setBaseURL(provider.baseURL);
      setApiKey(provider.apiKey);
      setModelName(provider.modelName);
    } else {
      // Reset form for new provider
      setName('');
      setBaseURL('');
      setApiKey('');
      setModelName('');
    }
  }, [provider]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const providerData = { name, baseURL, apiKey, modelName };
    if (provider?.id) {
        onSave({ ...providerData, id: provider.id });
    } else {
        onSave(providerData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{provider ? '編輯自訂 LLM 提供者' : '新增自訂 LLM 提供者'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider-name">名稱</Label>
            <Input
              id="provider-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：我的本地 Ollama"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-baseurl">Base URL</Label>
            <Input
              id="provider-baseurl"
              value={baseURL}
              onChange={(e) => setBaseURL(e.target.value)}
              placeholder="例如：http://localhost:11434/v1"
              required
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="provider-modelname">模型名稱</Label>
            <Input
              id="provider-modelname"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="例如：llama3 或 gpt-4-turbo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-apikey">API Key (選填)</Label>
            <Input
              id="provider-apikey"
              type="password" // 使用 password 類型稍微隱藏
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="如果需要的話輸入 API Key"
            />
             <p className="text-xs text-muted-foreground">
                API 金鑰將儲存在瀏覽器中。請勿在不信任的環境中使用。
             </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
          <Button type="submit">儲存</Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default CustomLLMProviderForm; 