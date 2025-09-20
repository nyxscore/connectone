"use client";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({
  currentStep,
  totalSteps,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex items-center">
              {/* 단계 원 */}
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                  ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white"
                      : isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "bg-white border-gray-300 text-gray-400"
                  }
                `}
              >
                {isCompleted ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{stepNumber}</span>
                )}
              </div>

              {/* 연결선 */}
              {stepNumber < totalSteps && (
                <div
                  className={`
                    flex-1 h-0.5 mx-4 transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-green-500"
                        : isActive
                          ? "bg-blue-600"
                          : "bg-gray-300"
                    }
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 단계 라벨 */}
      <div className="flex justify-between mt-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div
              key={stepNumber}
              className={`
                text-xs font-medium transition-colors duration-300
                ${isActive || isCompleted ? "text-gray-900" : "text-gray-400"}
              `}
            >
              {stepNumber === 1 && "카테고리"}
              {stepNumber === 2 && "거래 유형"}
              {stepNumber === 3 && "상품 검색"}
            </div>
          );
        })}
      </div>
    </div>
  );
}
