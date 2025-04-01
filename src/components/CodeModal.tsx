"use client"

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

const CodeModal: React.FC<CodeModalProps> = ({ isOpen, onClose, code }) => {
  const [copied, setCopied] = useState(false);

  // 如果模態框關閉，則不渲染任何內容
  if (!isOpen) return null;

  // 複製程式碼的處理函數
  const handleCopy = () => {
    console.log("嘗試複製程式碼");
    navigator.clipboard.writeText(code)
      .then(() => {
        console.log("複製成功");
        setCopied(true);
        toast({
          title: "複製成功！",
          description: "程式碼已複製到剪貼簿",
          duration: 2000,
        });
        
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('複製程式碼失敗:', err);
        toast({
          title: "複製失敗",
          description: "請稍後再試",
          variant: "destructive",
          duration: 2000,
        });
      });
  };

  console.log("CodeModal 渲染中...", isOpen, code?.length);

  // 直接渲染模態框
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 999999, // 極高的 z-index
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題區 */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9fafb',
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            margin: 0,
            color: '#1f2937',
          }}>Generated OpenAI Agents Code</h2>
          <button 
            onClick={onClose} 
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex',
            }}
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>
        
        {/* 程式碼區域 */}
        <div style={{
          padding: '20px',
          overflow: 'auto',
          backgroundColor: '#1e1e1e',
          maxHeight: 'calc(85vh - 130px)',
        }}>
          <SyntaxHighlighter
            language="python"
            style={darcula}
            customStyle={{
              margin: 0,
              borderRadius: '6px',
              fontSize: '13px',
              lineHeight: '1.6',
            }}
            showLineNumbers
          >
            {code || '# No code generated yet.'}
          </SyntaxHighlighter>
        </div>
        
        {/* 底部按鈕區 */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Close
          </button>
          <button 
            onClick={handleCopy}
            style={{
              padding: '8px 16px',
              backgroundColor: copied ? '#10b981' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
            }}
          >
            {copied ? (
              <>
                <Check size={16} /> Copied!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeModal; 