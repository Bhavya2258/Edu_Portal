import {
  User,
  Course,
  CourseNote,
  RecordedLecture,
  LiveSession,
  Quiz,
  QuizSubmission,
  AttendanceRecord,
  CourseAttendanceStats,
  StudentFeeRecord,
  Notice,
  InstitutionAnalytics,
  WifiVerificationStatus
} from "../types";

const BASE_URL = "";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const storedUser = localStorage.getItem("eduportal_user");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Only attach x-user-id for non-login endpoints
  if (storedUser && !endpoint.includes("/api/auth/google-login")) {
    try {
      const u = JSON.parse(storedUser);
      if (u && u.id) {
        headers["x-user-id"] = u.id;
      }
    } catch (e) {
      // ignore
    }
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  googleLogin: (payload: { email: string; name?: string; avatar?: string; googleSub?: string; requestedRole?: string }) =>
    request<{ user: User; isNew: boolean }>("/api/auth/google-login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getDemoUsers: () => request<User[]>("/api/auth/demo-users"),
  getMe: () => request<User>("/api/auth/me"),

  // Admin
  getUsers: (params?: { role?: string; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    return request<User[]>(`/api/admin/users?${query.toString()}`);
  },

  approveUser: (id: string, body: { role: string; department?: string; rollNumber?: string; employeeId?: string }) =>
    request<{ message: string; user: User }>(`/api/admin/users/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  rejectUser: (id: string) =>
    request<{ message: string; user: User }>(`/api/admin/users/${id}/reject`, {
      method: "POST",
    }),

  updateUserRole: (id: string, body: Partial<User>) =>
    request<{ message: string; user: User }>(`/api/admin/users/${id}/role`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  deleteUser: (id: string) =>
    request<{ message: string }>(`/api/admin/users/${id}`, {
      method: "DELETE",
    }),

  getAnalytics: () => request<InstitutionAnalytics>("/api/admin/analytics"),

  // Courses
  getCourses: (params?: { teacherId?: string; studentId?: string }) => {
    const query = new URLSearchParams();
    if (params?.teacherId) query.set("teacherId", params.teacherId);
    if (params?.studentId) query.set("studentId", params.studentId);
    return request<(Course & { isLiveNow?: boolean; liveSessionId?: string; notesCount?: number; lecturesCount?: number })[]>(
      `/api/courses?${query.toString()}`
    );
  },

  getCourseById: (id: string) =>
    request<{
      course: Course;
      notes: CourseNote[];
      lectures: RecordedLecture[];
      notices: Notice[];
      quizzes: Quiz[];
      liveSession: LiveSession | null;
    }>(`/api/courses/${id}`),

  createCourse: (course: Partial<Course>) =>
    request<Course>("/api/courses", {
      method: "POST",
      body: JSON.stringify(course),
    }),

  updateCourse: (id: string, course: Partial<Course>) =>
    request<Course>(`/api/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(course),
    }),

  deleteCourse: (id: string) =>
    request<{ message: string }>(`/api/courses/${id}`, {
      method: "DELETE",
    }),

  toggleEnroll: (courseId: string, studentId: string) =>
    request<{ course: Course; enrolled: boolean }>(`/api/courses/${courseId}/enroll`, {
      method: "POST",
      body: JSON.stringify({ studentId }),
    }),

  enrollCourse: (courseId: string, studentId?: string) => {
    const storedUser = localStorage.getItem("eduportal_user");
    const uid = studentId || (storedUser ? JSON.parse(storedUser)?.id : "usr-student-1");
    return request<{ course: Course; enrolled: boolean }>(`/api/courses/${courseId}/enroll`, {
      method: "POST",
      body: JSON.stringify({ studentId: uid }),
    });
  },

  unenrollCourse: (courseId: string, studentId?: string) => {
    const storedUser = localStorage.getItem("eduportal_user");
    const uid = studentId || (storedUser ? JSON.parse(storedUser)?.id : "usr-student-1");
    return request<{ course: Course; enrolled: boolean }>(`/api/courses/${courseId}/enroll`, {
      method: "POST",
      body: JSON.stringify({ studentId: uid }),
    });
  },

  // Notes
  getNotes: (params?: { courseId?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.courseId) query.set("courseId", params.courseId);
    if (params?.date) query.set("date", params.date);
    return request<CourseNote[]>(`/api/notes?${query.toString()}`);
  },

  uploadNote: (note: Partial<CourseNote>) =>
    request<CourseNote>("/api/notes", {
      method: "POST",
      body: JSON.stringify(note),
    }),

  deleteNote: (id: string) =>
    request<{ message: string }>(`/api/notes/${id}`, {
      method: "DELETE",
    }),

  downloadNote: (id: string) =>
    request<{ success: boolean }>(`/api/notes/${id}/download`, {
      method: "POST",
    }),

  // Recorded Lectures
  getLectures: (params?: { courseId?: string; date?: string }) => {
    const query = new URLSearchParams();
    if (params?.courseId) query.set("courseId", params.courseId);
    if (params?.date) query.set("date", params.date);
    return request<RecordedLecture[]>(`/api/lectures?${query.toString()}`);
  },

  saveLecture: (lecture: Partial<RecordedLecture>) =>
    request<RecordedLecture>("/api/lectures", {
      method: "POST",
      body: JSON.stringify(lecture),
    }),

  deleteLecture: (id: string) =>
    request<{ message: string }>(`/api/lectures/${id}`, {
      method: "DELETE",
    }),

  recordLectureView: (id: string) =>
    request<{ success: boolean }>(`/api/lectures/${id}/view`, {
      method: "POST",
    }),

  // Live Sessions
  getLiveSessions: () => request<LiveSession[]>("/api/live-sessions"),
  getActiveLiveSessions: () => request<LiveSession[]>("/api/live-sessions"),
  getLiveSession: (id: string) => request<LiveSession>(`/api/live-sessions/${id}`),

  startLiveSession: (payload: { courseId: string; topic?: string; teacherId: string }) =>
    request<LiveSession>("/api/live-sessions/start", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  stopLiveSession: (id: string) =>
    request<{ message: string; session: LiveSession }>(`/api/live-sessions/${id}/stop`, {
      method: "POST",
    }),

  joinLiveSession: (id: string, student: { studentId: string; name: string; email?: string; avatar?: string; simulatedSsid?: string }) =>
    request<{ session: LiveSession; wifiInfo: WifiVerificationStatus }>(`/api/live-sessions/${id}/join`, {
      method: "POST",
      body: JSON.stringify(student),
    }),

  leaveLiveSession: (id: string, studentId: string) =>
    request<{ success: boolean }>(`/api/live-sessions/${id}/leave`, {
      method: "POST",
      body: JSON.stringify({ studentId }),
    }),

  // Quizzes & Assignments
  getQuizzes: (courseId?: string) => {
    const query = courseId ? `?courseId=${courseId}` : "";
    return request<Quiz[]>(`/api/quizzes${query}`);
  },

  getQuiz: (id: string) => request<Quiz>(`/api/quizzes/${id}`),

  createQuiz: (quiz: Partial<Quiz>) =>
    request<Quiz>("/api/quizzes", {
      method: "POST",
      body: JSON.stringify(quiz),
    }),

  pushQuizLive: (quizId: string, liveSessionId?: string) =>
    request<{ message: string; quiz: Quiz }>(`/api/quizzes/${quizId}/push`, {
      method: "POST",
      body: JSON.stringify({ liveSessionId }),
    }),

  submitQuiz: (
    quizId: string,
    submissionOrAnswers:
      | { studentId?: string; studentName?: string; studentEmail?: string; answers: { questionId: string; selectedOption: number }[]; timeSpentSeconds?: number }
      | { questionId: string; selectedOptionIndex: number }[]
  ) => {
    const storedUser = localStorage.getItem("eduportal_user");
    const u = storedUser ? JSON.parse(storedUser) : null;
    let body: any;

    if (Array.isArray(submissionOrAnswers)) {
      body = {
        studentId: u?.id || "usr-student-1",
        studentName: u?.name || "Student",
        studentEmail: u?.email,
        answers: submissionOrAnswers.map((a) => ({
          questionId: a.questionId,
          selectedOption: a.selectedOptionIndex,
        })),
      };
    } else {
      body = {
        studentId: submissionOrAnswers.studentId || u?.id || "usr-student-1",
        studentName: submissionOrAnswers.studentName || u?.name || "Student",
        studentEmail: submissionOrAnswers.studentEmail || u?.email,
        answers: submissionOrAnswers.answers,
        timeSpentSeconds: submissionOrAnswers.timeSpentSeconds,
      };
    }

    return request<{ submission: QuizSubmission; message?: string } & QuizSubmission>(`/api/quizzes/${quizId}/submit`, {
      method: "POST",
      body: JSON.stringify(body),
    }).then((res: any) => {
      // normalize so both res.submission and direct res work
      if (!res.submission) {
        res.submission = res;
      }
      return res;
    });
  },

  getQuizSubmissions: (quizId: string) => request<QuizSubmission[]>(`/api/quizzes/${quizId}/submissions`),

  // Attendance
  getNetworkStatus: (simulatedSsid?: string) => {
    const q = simulatedSsid ? `?simulatedSsid=${encodeURIComponent(simulatedSsid)}` : "";
    return request<WifiVerificationStatus>(`/api/attendance/network-status${q}`);
  },

  checkWifiStatus: (simulatedSsid?: string) => {
    const q = simulatedSsid ? `?simulatedSsid=${encodeURIComponent(simulatedSsid)}` : "";
    return request<WifiVerificationStatus>(`/api/attendance/network-status${q}`);
  },

  markAttendance: (payload: { courseId: string; studentId?: string; studentName?: string; simulatedSsid?: string; courseCode?: string; courseTitle?: string; deviceSsid?: string }) => {
    const storedUser = localStorage.getItem("eduportal_user");
    const u = storedUser ? JSON.parse(storedUser) : null;
    return request<{ message: string; record: AttendanceRecord; wifiInfo: WifiVerificationStatus }>("/api/attendance/check-in", {
      method: "POST",
      body: JSON.stringify({
        courseId: payload.courseId,
        studentId: payload.studentId || u?.id || "usr-student-1",
        studentName: payload.studentName || u?.name || "Student",
        simulatedSsid: payload.simulatedSsid || payload.deviceSsid,
      }),
    });
  },

  getStudentAttendance: (studentId: string) =>
    request<{
      records: AttendanceRecord[];
      summaries: CourseAttendanceStats[];
      overallPercentage: number;
    }>(`/api/attendance/student/${studentId}`),

  getMyAttendance: () => {
    const storedUser = localStorage.getItem("eduportal_user");
    const uid = storedUser ? JSON.parse(storedUser)?.id : "usr-student-1";
    return request<{
      records: AttendanceRecord[];
      summaries: CourseAttendanceStats[];
      overallPercentage: number;
    }>(`/api/attendance/student/${uid}`).then((res) => res.records || []);
  },

  getCourseAttendance: (courseId: string) => request<AttendanceRecord[]>(`/api/attendance/course/${courseId}`),

  // Fees
  getStudentFee: (studentId: string) => request<StudentFeeRecord>(`/api/fees/student/${studentId}`),
  getMyFees: () => {
    const storedUser = localStorage.getItem("eduportal_user");
    const uid = storedUser ? JSON.parse(storedUser)?.id : "usr-student-1";
    return request<StudentFeeRecord>(`/api/fees/student/${uid}`);
  },
  getAllFees: () => request<StudentFeeRecord[]>("/api/fees/all"),

  updateStudentFee: (studentId: string, data: Partial<StudentFeeRecord>) =>
    request<StudentFeeRecord>(`/api/fees/student/${studentId}/update`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  payFees: (payload: {
    studentId?: string;
    amount: number;
    paymentMethod?: "card" | "upi" | "netbanking";
    paymentGateway?: "stripe_sandbox" | "razorpay_sandbox";
    gateway?: "stripe" | "razorpay";
    feeBreakdown?: any[];
  }) => {
    const storedUser = localStorage.getItem("eduportal_user");
    const uid = payload.studentId || (storedUser ? JSON.parse(storedUser)?.id : "usr-student-1");
    const gw = payload.gateway === "razorpay" ? "razorpay_sandbox" : "stripe_sandbox";
    return request<{ message: string; transaction: any; feeRecord: StudentFeeRecord }>("/api/fees/pay", {
      method: "POST",
      body: JSON.stringify({
        studentId: uid,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod || "card",
        paymentGateway: payload.paymentGateway || gw,
      }),
    });
  },

  // Notices
  getNotices: (params?: { courseId?: string | null; role?: string }) => {
    const query = new URLSearchParams();
    if (params?.courseId !== undefined) query.set("courseId", params.courseId === null ? "" : params.courseId);
    if (params?.role) query.set("role", params.role);
    return request<Notice[]>(`/api/notices?${query.toString()}`);
  },

  createNotice: (notice: Partial<Notice>) =>
    request<Notice>("/api/notices", {
      method: "POST",
      body: JSON.stringify(notice),
    }),

  deleteNotice: (id: string) =>
    request<{ message: string }>(`/api/notices/${id}`, {
      method: "DELETE",
    }),
};
