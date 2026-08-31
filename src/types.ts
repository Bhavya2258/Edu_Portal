export type UserRole = 'admin' | 'teacher' | 'student' | 'pending';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'deactivated';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  rollNumber?: string;
  employeeId?: string;
  phone?: string;
  joinedAt: string;
  lastLogin: string;
}

export interface CourseSchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  room: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  department: string;
  semester: string;
  credits: number;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  schedule: CourseSchedule[];
  enrolledStudentIds: string[];
  bannerColor?: string;
  createdAt: string;
}

export interface CourseNote {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  fileUrl: string;
  fileName: string;
  fileType: 'pdf' | 'doc' | 'image' | 'presentation' | 'code';
  fileSize: string;
  uploadedBy: string;
  uploadedByName: string;
  downloadCount: number;
}

export interface RecordedLecture {
  id: string;
  courseId: string;
  title: string;
  topic: string;
  date: string;
  duration: string;
  durationSeconds: number;
  videoUrl: string;
  thumbnailUrl: string;
  summary?: string;
  keyTakeaways?: string[];
  uploadedBy: string;
  uploadedByName: string;
  viewsCount: number;
}

export interface LiveViewer {
  studentId: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  isWifiVerified: boolean;
}

export interface LiveSession {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  topic: string;
  startedAt: string;
  isLive: boolean;
  viewers: LiveViewer[];
  activeQuizId?: string | null;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  points: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  courseCode?: string;
  title: string;
  topic?: string;
  description?: string;
  createdBy?: string;
  durationSeconds: number;
  totalPoints: number;
  questions: QuizQuestion[];
  status: 'draft' | 'active' | 'completed';
  isLive?: boolean;
  startedAt?: string;
  endsAt?: string;
  liveSessionId?: string | null;
  createdAt: string;
  submissionsCount?: number;
  averageScore?: number;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  answers: {
    questionId: string;
    selectedOption: number;
    isCorrect: boolean;
  }[];
  score: number;
  totalPoints: number;
  percentage: number;
  submittedAt: string;
  passed: boolean;
  timeSpentSeconds: number;
}

export interface AttendanceRecord {
  id: string;
  courseId: string;
  courseCode?: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  verificationMethod: 'wifi_ip' | 'manual_override';
  ipAddress?: string;
  networkSsid?: string;
  timestamp: string;
}

export interface CourseAttendanceStats {
  courseId: string;
  courseCode: string;
  courseTitle: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  eligibleForExams: boolean;
}

export interface FeeItem {
  id: string;
  title: string;
  amount: number;
  category: 'tuition' | 'lab' | 'library' | 'sports' | 'development' | 'examination';
}

export interface FeePaymentTransaction {
  id: string;
  transactionId: string;
  amount: number;
  paymentMethod: 'card' | 'upi' | 'netbanking';
  paymentGateway: 'stripe_sandbox' | 'razorpay_sandbox';
  paidAt: string;
  receiptNumber: string;
  status: 'success' | 'failed';
  feeBreakdown: FeeItem[];
}

export interface StudentFeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  rollNumber: string;
  department: string;
  semester: string;
  academicYear: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'partial' | 'overdue';
  feeItems: FeeItem[];
  paymentHistory: FeePaymentTransaction[];
}

export type NoticePriority = 'urgent' | 'event' | 'academic' | 'general';

export interface Notice {
  id: string;
  courseId: string | null; // null = institution-wide
  courseCode?: string;
  title: string;
  content: string;
  priority: NoticePriority;
  targetRole: 'all' | 'students' | 'teachers';
  authorId: string;
  authorName: string;
  authorRole: string;
  date: string;
  pinned: boolean;
  attachmentName?: string;
  attachmentUrl?: string;
}

export interface InstitutionAnalytics {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  pendingApprovalsCount: number;
  totalCourses: number;
  activeLiveClassesCount: number;
  totalFeesCollected: number;
  totalFeesPending: number;
  overallAttendanceAverage: number;
  departmentStats: {
    department: string;
    studentsCount: number;
    coursesCount: number;
    avgAttendance: number;
  }[];
  recentActivity: {
    id: string;
    type: 'login' | 'stream_start' | 'quiz_submission' | 'fee_payment' | 'note_uploaded';
    title: string;
    timestamp: string;
    user: string;
  }[];
}

export interface WifiVerificationStatus {
  isCampusWifi: boolean;
  clientIp: string;
  detectedSsid: string;
  allowedSubnet: string;
  matchedCampusNetwork: string;
  message: string;
}
