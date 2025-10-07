"use client";

import { useEffect } from "react";

interface SimpleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

export function SimpleChatModal({ isOpen, onClose, chatId }: SimpleChatModalProps) {
  useEffect(() => {
    console.log("SimpleChatModal: 렌더링됨", { isOpen, chatId });
  }, [isOpen, chatId]);

  if (!isOpen) {
    console.log("SimpleChatModal: isOpen이 false이므로 null 반환");
    return null;
  }

  console.log("SimpleChatModal: 모달 렌더링 시작");

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '900px',
          height: '85vh',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '2px solid #e5e7eb',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
              🎉 채팅 모달이 열렸습니다!
            </h2>
            <button 
              onClick={onClose}
              style={{ 
                fontSize: '24px', 
                color: '#6b7280',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div style={{ padding: '24px', height: 'calc(100% - 80px)', overflow: 'auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '16px', color: '#059669', fontWeight: '600', marginBottom: '8px' }}>
              ✅ 모달이 성공적으로 열렸습니다!
            </p>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
              <strong>채팅 ID:</strong> {chatId}
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af' }}>
              이 모달이 보인다면 문제가 해결된 것입니다!
            </p>
          </div>
          
          {/* 채팅 인터페이스 */}
          <div style={{ 
            border: '2px solid #e5e7eb', 
            borderRadius: '12px', 
            height: '400px', 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#fafafa'
          }}>
            <div style={{ 
              padding: '16px', 
              borderBottom: '1px solid #e5e7eb', 
              backgroundColor: '#f1f5f9',
              borderTopLeftRadius: '10px',
              borderTopRightRadius: '10px'
            }}>
              <h3 style={{ fontWeight: '600', color: '#374151' }}>💬 채팅방</h3>
            </div>
            <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
              <div style={{ textAlign: 'center', marginTop: '60px' }}>
                <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>
                  채팅 내용이 여기에 표시됩니다
                </p>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Chat ID: {chatId}
                </p>
              </div>
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="text" 
                  placeholder="메시지를 입력하세요..." 
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none',
                    fontSize: '14px'
                  }}
                />
                <button style={{
                  padding: '12px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}>
                  전송
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
