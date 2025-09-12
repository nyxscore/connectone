// 공개 Q&A 관련 타입 정의

export interface PublicQuestion {
  id: string;
  title: string;
  content: string;
  authorUid: string;
  authorName?: string;
  tags: string[];
  views: number;
  likes: number;
  likedBy: string[];
  answers: PublicAnswer[];
  isResolved: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface PublicAnswer {
  id: string;
  questionId: string;
  content: string;
  authorUid: string;
  authorName?: string;
  isAccepted: boolean;
  likes: number;
  likedBy: string[];
  createdAt: any;
  updatedAt: any;
}

export interface CreatePublicQuestionInput {
  title: string;
  content: string;
  authorUid: string;
  authorName: string;
  tags: string[];
}

export interface CreatePublicAnswerInput {
  questionId: string;
  content: string;
  authorUid: string;
  authorName: string;
}

export interface QaListFilters {
  keyword?: string;
  tags?: string[];
  isResolved?: boolean;
}

export interface QaListOptions {
  limit?: number;
  lastDoc?: any;
  sortBy?: "createdAt" | "views" | "likes";
  sortOrder?: "desc" | "asc";
  filters?: QaListFilters;
}

// 인기 태그 타입
export interface PopularTag {
  tag: string;
  count: number;
}

// Q&A 통계 타입
export interface QaStats {
  totalQuestions: number;
  totalAnswers: number;
  resolvedQuestions: number;
  unresolvedQuestions: number;
  popularTags: PopularTag[];
}
