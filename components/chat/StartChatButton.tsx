"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/hooks/useAuth";
import { Button } from "../ui/Button";
import { MessageCircle, X } from "lucide-react";
import { EnhancedChatModal } from "./EnhancedChatModal";
import { getItem } from "../../lib/api/products";

interface StartChatButtonProps {
  itemId: string;
  sellerUid: string;
  className?: string;
}

export function StartChatButton({
  itemId,
  sellerUid,
  className,
}: StartChatButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [showChatModal, setShowChatModal] = useState(false);
  const [showTradeTypeModal, setShowTradeTypeModal] = useState(false);
  const [selectedTradeType, setSelectedTradeType] = useState<string>("");
  const [tradeOptions, setTradeOptions] = useState<string[]>([]);

  // 상품 정보 로드
  useEffect(() => {
    const loadItem = async () => {
      try {
        const result = await getItem(itemId);
        if (result.success && result.item) {
          // escrowEnabled이면 안전결제만
          if (result.item.escrowEnabled) {
            setTradeOptions(["안전결제"]);
            setSelectedTradeType("안전결제");
          } else {
            setTradeOptions(result.item.tradeOptions || ["직거래"]);
          }
        }
      } catch (error) {
        console.error("상품 정보 로드 실패:", error);
      }
    };
    loadItem();
  }, [itemId]);

  const startChat = async () => {
    if (!user) {
      router.push(`/auth/login`);
      return;
    }

    // 거래 옵션이 여러 개면 선택 모달 표시
    if (tradeOptions.length > 1) {
      setShowTradeTypeModal(true);
    } else {
      // 거래 옵션이 하나면 바로 채팅 시작
      setSelectedTradeType(tradeOptions[0] || "직거래");
      setShowChatModal(true);
    }
  };

  const handleTradeTypeSelect = (tradeType: string) => {
    setSelectedTradeType(tradeType);
    setShowTradeTypeModal(false);
    setShowChatModal(true);
  };

  return (
    <>
      <Button
        onClick={startChat}
        className={`w-full bg-green-600 hover:bg-green-700 text-white ${className || ""}`}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        1:1 채팅하기
      </Button>

      {/* 거래 방식 선택 모달 */}
      {showTradeTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                거래 방식 선택
              </h3>
              <button
                onClick={() => setShowTradeTypeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              원하시는 거래 방식을 선택해주세요
            </p>
            <div className="space-y-2">
              {tradeOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleTradeTypeSelect(option)}
                  className="w-full p-3 text-left border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{option}</span>
                  {option === "안전결제" && (
                    <p className="text-xs text-gray-500 mt-1">
                      거래 보호 서비스 제공
                    </p>
                  )}
                  {option === "택배" && (
                    <p className="text-xs text-gray-500 mt-1">
                      택배 거래
                    </p>
                  )}
                  {option === "직거래" && (
                    <p className="text-xs text-gray-500 mt-1">
                      직접 만나서 거래
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 채팅 모달 */}
      <EnhancedChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        itemId={itemId}
        sellerUid={sellerUid}
        tradeType={selectedTradeType}
      />
    </>
  );
}
