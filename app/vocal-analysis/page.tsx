"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Upload, Music, Waveform, Brain, TrendingUp, Award } from "lucide-react";
import toast from "react-hot-toast";

export default function VocalAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("audio/")) {
        setSelectedFile(file);
        toast.success("음악 파일이 선택되었습니다.");
      } else {
        toast.error("음악 파일만 업로드 가능합니다.");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error("음악 파일을 선택해주세요.");
      return;
    }

    setIsAnalyzing(true);
    try {
      // AI 분석 API 호출 (데모 버전)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 데모 결과
      const demoResult = {
        overall: 85,
        vocal: {
          pitch: 88,
          tone: 82,
          stability: 90,
        },
        emotion: {
          joy: 75,
          sadness: 15,
          energy: 85,
        },
        recommendation: "전반적으로 훌륭한 보컬입니다. 음정이 정확하고 감정 표현이 풍부합니다.",
      };
      
      setAnalysisResult(demoResult);
      toast.success("AI 음악 분석이 완료되었습니다!");
    } catch (error) {
      console.error("분석 실패:", error);
      toast.error("분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Brain className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI 음악 분석
          </h1>
          <p className="text-lg text-gray-600">
            인공지능이 당신의 음악을 분석하고 전문적인 피드백을 제공합니다
          </p>
        </div>

        {/* 업로드 카드 */}
        <Card className="p-8 mb-8">
          <div className="text-center">
            <div className="mb-6">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                음악 파일 업로드
              </h2>
              <p className="text-gray-600">
                MP3, WAV, M4A 등 다양한 음악 파일 형식을 지원합니다
              </p>
            </div>

            {selectedFile ? (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center space-x-3">
                  <Waveform className="w-6 h-6 text-blue-600" />
                  <span className="text-blue-900 font-medium">
                    {selectedFile.name}
                  </span>
                  <span className="text-blue-600 text-sm">
                    ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 mb-6 hover:border-blue-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  파일을 선택하거나 여기로 드래그하세요
                </p>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  파일 선택
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              
              <Button
                onClick={handleAnalyze}
                disabled={!selectedFile || isAnalyzing}
                className="min-w-[120px]"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    분석 중...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    AI 분석 시작
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* 분석 결과 */}
        {analysisResult && (
          <div className="space-y-6">
            <Card className="p-8">
              <div className="text-center mb-8">
                <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  종합 점수
                </h2>
                <div className="text-6xl font-bold text-blue-600">
                  {analysisResult.overall}
                  <span className="text-3xl text-gray-400">/100</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    음정
                  </h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {analysisResult.vocal.pitch}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    음색
                  </h3>
                  <div className="text-3xl font-bold text-purple-600">
                    {analysisResult.vocal.tone}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    안정성
                  </h3>
                  <div className="text-3xl font-bold text-green-600">
                    {analysisResult.vocal.stability}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  AI 전문가 의견
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {analysisResult.recommendation}
                </p>
              </div>
            </Card>

            <Card className="p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                감정 분석
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">기쁨</span>
                    <span className="text-blue-600 font-semibold">
                      {analysisResult.emotion.joy}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${analysisResult.emotion.joy}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">슬픔</span>
                    <span className="text-purple-600 font-semibold">
                      {analysisResult.emotion.sadness}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${analysisResult.emotion.sadness}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">에너지</span>
                    <span className="text-green-600 font-semibold">
                      {analysisResult.emotion.energy}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${analysisResult.emotion.energy}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 기능 소개 */}
        {!analysisResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Card className="p-6 text-center">
              <Music className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                음악 분석
              </h3>
              <p className="text-gray-600 text-sm">
                AI가 음정, 음색, 리듬 등을 정밀하게 분석합니다
              </p>
            </Card>
            <Card className="p-6 text-center">
              <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                감정 분석
              </h3>
              <p className="text-gray-600 text-sm">
                음악에 담긴 감정과 분위기를 AI가 파악합니다
              </p>
            </Card>
            <Card className="p-6 text-center">
              <TrendingUp className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                전문 피드백
              </h3>
              <p className="text-gray-600 text-sm">
                AI 전문가가 개선점과 강점을 알려드립니다
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
