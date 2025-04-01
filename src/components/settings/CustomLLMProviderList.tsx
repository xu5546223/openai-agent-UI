import React from 'react';
import useWorkflowStore, { CustomLLMProvider } from '../../store/workflowStore'; // 確保路徑正確
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Edit } from 'lucide-react'; // 假設使用 lucide-react 圖示

interface CustomLLMProviderListProps {
  onEdit: (provider: CustomLLMProvider) => void;
  onAdd: () => void;
}

const CustomLLMProviderList: React.FC<CustomLLMProviderListProps> = ({ onEdit, onAdd }) => {
  const { customLLMProviders, deleteCustomLLMProvider } = useWorkflowStore();

  const handleDelete = (id: string) => {
    // 可以加入確認對話框
    if (window.confirm('確定要刪除這個提供者設定嗎？')) {
      deleteCustomLLMProvider(id);
    }
  };

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>自訂 LLM 提供者</CardTitle>
                    <CardDescription>管理你的自訂大型語言模型設定。</CardDescription>
                </div>
                <Button onClick={onAdd}>新增提供者</Button>
            </div>
        </CardHeader>
      <CardContent>
        {customLLMProviders.length === 0 ? (
          <p className="text-center text-muted-foreground">尚未設定任何自訂 LLM 提供者。</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名稱</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead>模型名稱</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customLLMProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>{provider.name}</TableCell>
                  <TableCell>{provider.baseURL}</TableCell>
                  <TableCell>{provider.modelName}</TableCell>
                  <TableCell className="space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(provider)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(provider.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomLLMProviderList; 