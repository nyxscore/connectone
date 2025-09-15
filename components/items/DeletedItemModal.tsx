"use client";

import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { X, Trash2, ArrowLeft } from "lucide-react";

interface DeletedItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTitle?: string;
}

export function DeletedItemModal({
  isOpen,
  onClose,
  itemTitle,
}: DeletedItemModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            상품 삭제 완료
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <div className="text-center">
            {/* 삭제 아이콘 */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>

            {/* 메시지 */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              상품이 삭제되었습니다
            </h3>
            <p className="text-gray-600 mb-6">
              {itemTitle ? `"${itemTitle}"` : "선택한 상품"}이 성공적으로
              삭제되었습니다.
              <br />
              삭제된 상품은 복구할 수 없습니다.
            </p>

            {/* 버튼들 */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/list")}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                상품 목록으로
              </Button>
              <Button
                onClick={() => (window.location.href = "/sell")}
                className="flex-1"
              >
                새 상품 등록
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
