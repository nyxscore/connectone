// 레슨 관련 타입 정의

export interface Instructor {
  id: string;
  name: string;
  photo: string;
  specialty: string; // 레슨 과목 (예: ["피아노", "보컬"])
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  location: string;
  experience: string;
  bio: string;
  certifications: string[];
  tags: string[]; // 인스타 스타일 태그 (예: ["꼼꼼한", "친근한", "경력10년"])
  availability: string[]; // 가능한 요일/시간 (예: ["월요일 오후 2시~6시", "주말 오전 가능"])
  lessonTypes: LessonType[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface LessonType {
  name: string;
  duration: number; // 분
  price: number;
  description: string;
}

export interface Lesson {
  id: string;
  instructorId: string;
  userId: string;
  instructorName: string;
  userName: string;
  lessonType: LessonType;
  scheduledDate: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentId?: string;
  paymentStatus: "pending" | "paid" | "refunded";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  instructorId: string;
  lessonId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstructorRecommendation {
  instructorId: string;
  score: number;
  reason: string;
  matchedTags: string[];
}
