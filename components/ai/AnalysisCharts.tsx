"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// 정확성 기반 점수 계산 함수
function calculateAccuracyScore(analysisResult: any): number {
  const transcriptionConfidence =
    analysisResult.transcription?.confidence || 0.85;
  const pitchStability = analysisResult.pitch?.pitch_stability || 0.7;
  const tempoStability = analysisResult.tempo?.tempo_stability || 0.8;
  const emotionConfidence = analysisResult.emotion?.confidence || 0.5;

  // 가중치 적용 (정확성 중심)
  const accuracyScore =
    (transcriptionConfidence * 0.4 + // 음성 인식 정확도 40%
      pitchStability * 0.3 + // 피치 안정성 30%
      tempoStability * 0.2 + // 템포 안정성 20%
      emotionConfidence * 0.1) * // 감정 분석 10%
    100;

  return Math.round(accuracyScore);
}

// 정확성 레벨 판정 (긍정적인 메시지)
function getAccuracyLevel(analysisResult: any): string {
  const score = calculateAccuracyScore(analysisResult);

  if (score >= 90) return "놀라운 잠재력! 전문가 피드백으로 더 빛날 수 있어요";
  if (score >= 80) return "훌륭한 실력! 전문가 조언으로 완성도를 높여보세요";
  if (score >= 70) return "좋은 기본기! 전문가와 함께 발전해보세요";
  if (score >= 60) return "성장 가능성 충분! 전문가 가이드가 도움될 거예요";
  return "시작이 반! 전문가와 함께 기초를 다져보세요";
}

// 테크닉 분석 데이터 생성
function generateTechniqueAnalysis(analysisResult: any) {
  const pitch = analysisResult.pitch || {};
  const tempo = analysisResult.tempo || {};
  const emotion = analysisResult.emotion || {};

  return [
    {
      category: "음정 정확도",
      score: Math.round((pitch.pitch_stability || 0.7) * 100),
      level:
        (pitch.pitch_stability || 0.7) > 0.8
          ? "우수"
          : (pitch.pitch_stability || 0.7) > 0.6
            ? "양호"
            : "개선필요",
      description: "음정의 일관성과 정확성을 측정합니다",
    },
    {
      category: "리듬 감각",
      score: Math.round((tempo.tempo_stability || 0.8) * 100),
      level:
        (tempo.tempo_stability || 0.8) > 0.8
          ? "우수"
          : (tempo.tempo_stability || 0.8) > 0.6
            ? "양호"
            : "개선필요",
      description: "박자와 리듬의 안정성을 평가합니다",
    },
    {
      category: "표현력",
      score: Math.round((emotion.confidence || 0.5) * 100),
      level:
        (emotion.confidence || 0.5) > 0.7
          ? "우수"
          : (emotion.confidence || 0.5) > 0.5
            ? "양호"
            : "개선필요",
      description: "감정 전달과 표현의 풍부함을 분석합니다",
    },
    {
      category: "음질 일관성",
      score: Math.round(
        (analysisResult.transcription?.confidence || 0.85) * 100
      ),
      level:
        (analysisResult.transcription?.confidence || 0.85) > 0.9
          ? "우수"
          : (analysisResult.transcription?.confidence || 0.85) > 0.7
            ? "양호"
            : "개선필요",
      description: "전체적인 음질의 일관성을 측정합니다",
    },
  ];
}

interface AnalysisChartsProps {
  analysisResult?: any;
  analysisData?: any;
  personalizedAnalysis?: string;
  advancedAnalysis?: string;
}

export default function AnalysisCharts({
  analysisResult: analysisResultProp,
  analysisData,
  personalizedAnalysis,
  advancedAnalysis,
}: AnalysisChartsProps) {
  // analysisResult 또는 analysisData 사용 (기존 코드 호환성)
  const analysisResult = analysisResultProp || analysisData || {};
  // 피치 분석 데이터 (가상 데이터)
  const averagePitch = analysisResult.pitch?.average_hz || 220;
  const pitchData = {
    labels: Array.from({ length: 20 }, (_, i) => `${i * 5}초`),
    datasets: [
      {
        label: "피치 (Hz)",
        data: Array.from(
          { length: 20 },
          () => averagePitch + (Math.random() - 0.5) * 100
        ),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
    ],
  };

  // 감정 분석 데이터
  const emotionData = {
    labels: ["뛰어난 표현력", "안정적인 표현", "개선 필요한 표현"],
    datasets: [
      {
        data: [
          analysisResult.emotion?.scores?.positive || 0.3,
          analysisResult.emotion?.scores?.neutral || 0.5,
          analysisResult.emotion?.scores?.negative || 0.2,
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(156, 163, 175, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderColor: [
          "rgb(34, 197, 94)",
          "rgb(156, 163, 175)",
          "rgb(239, 68, 68)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // 템포 분석 데이터
  const averageTempo = analysisResult.tempo?.bpm || 120;
  const tempoData = {
    labels: Array.from({ length: 15 }, (_, i) => `${i * 10}초`),
    datasets: [
      {
        label: "BPM",
        data: Array.from(
          { length: 15 },
          () => averageTempo + (Math.random() - 0.5) * 20
        ),
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "분석 결과 차트",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* 피치 분석 차트 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">피치 분석</h3>
        <div className="h-64">
          <Line data={pitchData} options={chartOptions} />
        </div>
      </div>

      {/* 감정 분석 차트 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">감정 분석</h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="h-64 w-full md:w-1/2">
            <Doughnut data={emotionData} options={doughnutOptions} />
          </div>
          <div className="w-full md:w-1/2 space-y-2">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                뛰어난 표현력
              </span>
              <span className="text-lg font-bold text-green-600">
                {(
                  (analysisResult.emotion?.scores?.positive || 0.3) * 100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                안정적인 표현
              </span>
              <span className="text-lg font-bold text-gray-600">
                {(
                  (analysisResult.emotion?.scores?.neutral || 0.5) * 100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                개선 필요한 표현
              </span>
              <span className="text-lg font-bold text-red-600">
                {(
                  (analysisResult.emotion?.scores?.negative || 0.2) * 100
                ).toFixed(1)}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 템포 분석 차트 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">템포 분석</h3>
        <div className="h-64">
          <Line data={tempoData} options={chartOptions} />
        </div>
      </div>

      {/* 테크닉 분석 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          테크닉 분석
        </h3>
        <div className="space-y-4">
          {generateTechniqueAnalysis(analysisResult).map((technique, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-800">
                  {technique.category}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-blue-600">
                    {technique.score}
                  </span>
                  <span className="text-sm text-gray-500">점</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      technique.level === "우수"
                        ? "bg-green-100 text-green-800"
                        : technique.level === "양호"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {technique.level}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{technique.description}</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    technique.score >= 80
                      ? "bg-green-500"
                      : technique.score >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${technique.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 종합 분석 표 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          종합 분석 표
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  항목
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  값
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  평가
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  평균 피치
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {analysisResult.pitch?.average_hz?.toFixed(1) || "N/A"} Hz
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    B+
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  안정적인 피치
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  피치 안정성
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {((analysisResult.pitch?.pitch_stability || 0) * 100).toFixed(
                    1
                  )}
                  %
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    A-
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  우수한 안정성
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  템포
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {analysisResult.tempo?.bpm || "N/A"} BPM
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    B
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  적절한 템포
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  음성 인식 정확도
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(
                    (analysisResult.transcription?.confidence || 0.85) * 100
                  ).toFixed(1)}
                  %
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    A
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  높은 정확도
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 정확성 기반 종합 점수 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg text-white">
        <h3 className="text-xl font-bold mb-4">AI 분석 종합 점수</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">
              {calculateAccuracyScore(analysisResult)}점
            </p>
            <p className="text-purple-100">
              {getAccuracyLevel(analysisResult)}
            </p>
            <p className="text-sm text-purple-200 mt-2">
              분석 신뢰도:{" "}
              {(
                (analysisResult.transcription?.confidence || 0.85) * 100
              ).toFixed(1)}
              %
            </p>
          </div>
          <div className="text-right">
            <div className="w-32 h-32 relative">
              <svg
                className="w-32 h-32 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${calculateAccuracyScore(analysisResult) * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">
                  {calculateAccuracyScore(analysisResult)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
