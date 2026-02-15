// API Configuration: in dev use /api (Vite proxy) to avoid CORS; in prod use full URL
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'YOUR_APPS_SCRIPT_WEB_APP_URL');
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK === 'true' || false;

/**
 * Mock data for development when CORS blocks real API
 */
const MOCK_DATA = {
  // Auth
  loginUser: { 
    success: true, 
    message: 'Đăng nhập thành công!',
    user: {
      email: 'student@gmail.com',
      name: 'Test Student',
      phone: '0912345678'
    }
  },
  registerUser: {
    success: true,
    message: 'Đăng ký thành công! Vui lòng đợi admin phê duyệt.'
  },
  checkIsTeacher: false,
  getProfile: {
    email: 'student@gmail.com',
    name: 'Học sinh mẫu',
    phone: '0912345678',
    avatarUrl: '',
    dateOfBirth: '',
    gender: '',
    classGrade: '10A1',
    school: 'THPT Mẫu',
    address: '',
    parentName: '',
    parentPhone: '',
    lastLogin: '',
    bio: '',
    studyGoals: ''
  },
  
  // Courses (LMS)
  getHomeData: [
    {
      courseName: 'React Basics',
      thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect width="400" height="200" fill="%238b5cf6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-family="Arial"%3EReact Basics%3C/text%3E%3C/svg%3E',
      courseDesc: 'Học React từ cơ bản đến nâng cao'
    },
    {
      courseName: 'JavaScript ES6',
      thumbnailUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect width="400" height="200" fill="%23dc2626"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-size="24" font-family="Arial"%3EJavaScript ES6%3C/text%3E%3C/svg%3E',
      courseDesc: 'Modern JavaScript cho developers'
    }
  ],
  getCourseData: {
    courseName: 'React Basics',
    courseDesc: 'Học React từ cơ bản đến nâng cao',
    lessons: [
      { index: 1, lessonName: 'Bài 1: Giới thiệu', videoEmbedUrl: '', materialUrl: '' },
      { index: 2, lessonName: 'Bài 2: Components', videoEmbedUrl: '', materialUrl: '' }
    ]
  },
  
  // Study Rooms
  getCurrentUser: { 
    success: true, 
    email: 'student@gmail.com', 
    name: 'Test Student', 
    role: 'student', 
    active: true 
  },
  getRooms: [
    { room_id: 'R1', room_name: 'Silent Study', type: 'Focus', count: 12, status: 'open', meet_link: 'https://meet.google.com/new' },
    { room_id: 'R2', room_name: 'Pomodoro Lounge', type: 'Timer', count: 8, status: 'open', meet_link: 'https://meet.google.com/new' },
    { room_id: 'R3', room_name: 'Group Discussion', type: 'Collab', count: 5, status: 'open', meet_link: 'https://meet.google.com/new' },
    { room_id: 'R4', room_name: 'Chill Vibes', type: 'Relax', count: 20, status: 'open', meet_link: 'https://meet.google.com/new' },
  ],
  getUserStats: { success: true, totalMinutes: 245, sessionCount: 8, sessions: [] },
  joinRoom: { success: true, sessionId: 'S123', meetLink: 'https://meet.google.com/abc-xyz', roomId: 'R1' },
  leaveRoom: { success: true, duration: 45 },
  getMessages: [],
  sendMessage: { success: true, messageId: 'M123', email: 'student@gmail.com', timestamp: new Date() },
  getSchedule: [
    { EventId: 'E1', Date: new Date().toISOString().slice(0, 10), StartTime: '08:00', EndTime: '09:00', Title: 'Toán - Chương 1', CourseName: 'Toán 10', LessonName: 'Bài 1', RoomId: 'R1', Description: '' },
    { EventId: 'E2', Date: new Date().toISOString().slice(0, 10), StartTime: '14:00', EndTime: '15:00', Title: 'Văn', CourseName: 'Văn 10', LessonName: 'Bài 2', RoomId: '', Description: '' }
  ]
};

/**
 * API Service to communicate with Google Apps Script backend
 */
class APIService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.useMock = USE_MOCK_DATA;
  }

  /**
   * GET request - use query string to avoid CORS preflight (no OPTIONS).
   * Apps Script doGet supports same actions and returns CORS headers.
   */
  async get(action, params = {}) {
    if (this.useMock) {
      console.log(`[MOCK] ${action}`, params);
      return this.getMockData(action, params);
    }

    const query = new URLSearchParams({ action, ...params });
    const url = `${this.baseUrl}?${query.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      if (error.message.includes('fetch') || error.message.includes('CORS')) {
        console.warn(`[FALLBACK] Using mock data for ${action} due to CORS`);
        return this.getMockData(action, params);
      }
      throw error;
    }
  }

  /**
   * POST request - for write operations. May trigger CORS preflight;
   * if preflight fails (GAS does not support doOptions), use mock or proxy.
   */
  async post(action, data = {}) {
    if (this.useMock) {
      console.log(`[MOCK] POST ${action}`, data);
      return this.getMockData(action, data);
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      if (error.message.includes('fetch') || error.message.includes('CORS')) {
        console.warn(`[FALLBACK] Using mock data for ${action} due to CORS`);
        return this.getMockData(action, data);
      }
      throw error;
    }
  }

  /**
   * Get mock data for development
   */
  getMockData(action, params = {}) {
    const mockResponse = MOCK_DATA[action];
    
    if (typeof mockResponse === 'function') {
      return mockResponse(params);
    }
    
    // For joinRoom, return with provided roomId
    if (action === 'joinRoom' && params.roomId) {
      return { ...MOCK_DATA.joinRoom, roomId: params.roomId };
    }
    
    return mockResponse || { success: true, message: 'Mock response' };
  }

  // ===================================
  // AUTH METHODS
  // ===================================

  async registerUser(userData) {
    return this.post('registerUser', userData);
  }

  async loginUser(credential, password) {
    return this.post('loginUser', { credential, password });
  }

  async checkIsTeacher(email) {
    return this.get('checkIsTeacher', { email });
  }

  async getProfile(email) {
    const res = await this.get('getProfile', { email });
    if (res?.success && res.profile) return res.profile;
    if (res && typeof res === 'object' && res.email) return res;
    return null;
  }

  async updateProfile(profileData) {
    return this.post('updateProfile', { ...profileData });
  }

  // ===================================
  // COURSE METHODS (LMS)
  // ===================================

  async getHomeData() {
    return this.get('getHomeData');
  }

  async getCourseData(courseName) {
    return this.get('getCourseData', { courseName });
  }

  async addCourse(courseData) {
    return this.post('addCourse', courseData);
  }

  async getCourseForEdit(courseName) {
    return this.get('getCourseForEdit', { courseName });
  }

  async updateCourse(oldCourseName, courseData) {
    return this.post('updateCourse', { oldCourseName, courseData });
  }

  async deleteCourse(courseName) {
    return this.post('deleteCourse', { courseName });
  }

  async quickAddCourseFromFolder(folderUrl, courseDesc) {
    return this.post('quickAddCourseFromFolder', { folderUrl, courseDesc });
  }

  // ===================================
  // SECURITY METHODS
  // ===================================

  async logSecurityWarning(userEmail, warningType, details) {
    return this.post('logSecurityWarning', { userEmail, warningType, details });
  }

  // ===================================
  // LEGACY ROOM METHODS (Keep for self-study room)
  // ===================================

  async getCurrentUser() {
    return this.get('getCurrentUser');
  }

  async getUserStats(email = null) {
    return this.get('getUserStats', email ? { email } : {});
  }

  async getRooms() {
    return this.get('getRooms');
  }

  async joinRoom(roomId, user) {
    const body = { roomId };
    const email = (user && (user.email || (user.user && user.user.email))) ? String(user.email || user.user.email).trim() : null;
    if (email) {
      body.email = email;
      body.name = (user && (user.name || user.user?.name)) ? String(user.name || user.user.name).trim() : email;
    }
    return this.post('joinRoom', body);
  }

  async addRoom(data) {
    return this.post('addRoom', data);
  }

  async updateRoom(data) {
    return this.post('updateRoom', data);
  }

  async deleteRoom(roomId, email) {
    const body = { roomId };
    if (email) body.email = email;
    return this.post('deleteRoom', body);
  }

  async leaveRoom(sessionId) {
    return this.post('leaveRoom', { sessionId });
  }

  // ===================================
  // CHAT METHODS
  // ===================================

  async getMessages(roomId, limit = 50) {
    return this.get('getMessages', { roomId, limit: limit.toString() });
  }

  async sendMessage(roomId, message) {
    return this.post('sendMessage', { roomId, message });
  }

  async getSchedule(month, year) {
    const res = await this.get('getSchedule', { month: String(month), year: String(year) });
    return Array.isArray(res) ? res : [];
  }

  async addScheduleEvent(eventData) {
    return this.post('addScheduleEvent', eventData);
  }
}

// Export singleton instance
export const api = new APIService();

// Export class for testing or custom instances
export default APIService;
