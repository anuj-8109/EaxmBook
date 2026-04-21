import { API_BASE_URL } from './config';





// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  requestRegisterOtp: async (payload: { email: string; password: string; fullName: string }) =>
    apiRequest('/auth/register/request-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyRegisterOtp: async (payload: { email: string; code: string }) => {
    const data = await apiRequest('/auth/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  requestLoginOtp: async (email: string) =>
    apiRequest('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyLoginOtp: async (payload: { email: string; code: string }) => {
    const data = await apiRequest('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  requestPasswordOtp: async (email: string) =>
    apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPasswordWithOtp: async (payload: { email: string; code: string; password: string }) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  loginWithGoogle: async (credential: string) => {
    const data = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  getMe: async () => {
    return apiRequest('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  forgotPassword: async (email: string) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token: string, password: string) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  updateProfile: async (data: { full_name?: string; username?: string }) => {
    const response = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  updateAvatar: async (avatar_url: string) => {
    const response = await apiRequest('/auth/avatar', {
      method: 'PUT',
      body: JSON.stringify({ avatar_url }),
    });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  changePassword: async (current_password: string, new_password: string) => {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ current_password, new_password }),
    });
  },
};

// Categories API - Enhanced with tree structure
export const categoriesAPI = {
  getAll: (tree?: boolean, parentId?: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (tree) params.append('tree', 'true');
    if (parentId) params.append('parent_id', parentId);
    if (page && !tree) params.append('page', String(page));
    if (limit && !tree) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/categories${query}`);
  },
  getById: (id: string) => apiRequest(`/categories/${id}`),
  create: (data: any) => apiRequest('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/categories/${id}`, {
    method: 'DELETE',
  }),
  reorder: (categories: Array<{ id: string; order: number; parent_id?: string }>) => apiRequest('/categories/reorder', {
    method: 'POST',
    body: JSON.stringify({ categories }),
  }),
};

// Subjects API
export const subjectsAPI = {
  getAll: (categoryId?: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (categoryId && categoryId !== 'all') params.append('category_id', categoryId);
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/subjects${query}`);
  },
  getById: (id: string) => apiRequest(`/subjects/${id}`),
  create: (data: any) => apiRequest('/subjects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/subjects/${id}`, {
    method: 'DELETE',
  }),
};

// Topics API
export const topicsAPI = {
  getAll: (subjectId?: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (subjectId) params.append('subject_id', subjectId);
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/topics${query}`);
  },
  getById: (id: string) => apiRequest(`/topics/${id}`),
  create: (data: any) => apiRequest('/topics', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/topics/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/topics/${id}`, {
    method: 'DELETE',
  }),
};

// Tests API
export const testsAPI = {
  getAll: (options?: {
    categoryId?: string;
    isActive?: boolean;
    isLive?: boolean;
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (options?.categoryId) params.append('category_id', options.categoryId);
    if (options?.isActive !== undefined) params.append('is_active', String(options.isActive));
    if (options?.isLive !== undefined) params.append('is_live', String(options.isLive));
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.search) params.append('search', options.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/tests${query}`);
  },
  getById: (id: string) => apiRequest(`/tests/${id}`),
  create: (data: any) => apiRequest('/tests', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/tests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/tests/${id}`, {
    method: 'DELETE',
  }),
  getQuestions: (id: string) => apiRequest(`/tests/${id}/questions`),
  addQuestion: (id: string, questionId: string, order: number) => apiRequest(`/tests/${id}/questions`, {
    method: 'POST',
    body: JSON.stringify({ question_id: questionId, question_order: order }),
  }),
  removeQuestion: (id: string, questionId: string) => apiRequest(`/tests/${id}/questions/${questionId}`, {
    method: 'DELETE',
  }),
  generateWithTopics: (testCount?: number, questionsPerTest?: number) => apiRequest('/tests/generate/with-topics', {
    method: 'POST',
    body: JSON.stringify({ testCount, questionsPerTest }),
  }),
  addQuestionsToTopics: (categoryName?: string, questionsPerLevel?: number) => apiRequest('/tests/add-questions-to-topics', {
    method: 'POST',
    body: JSON.stringify({ categoryName, questionsPerLevel }),
  }),
};

// Questions API - Enhanced with advanced filtering
export const questionsAPI = {
  getAll: (filters?: {
    category_id?: string;
    subject_id?: string;
    topic_id?: string;
    difficulty?: string;
    difficulty_level?: number;
    exam_name?: string;
    question_reference?: string;
    time_duration?: number;
    category_ids?: string[];
    subject_ids?: string[];
    topic_ids?: string[];
    exam_names?: string[];
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/questions${query}`);
  },
  getById: (id: string) => apiRequest(`/questions/${id}`),
  create: (data: any) => apiRequest('/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/questions/${id}`, {
    method: 'DELETE',
  }),
  findDuplicates: () => apiRequest('/questions/duplicates/check'),
  bulkCreate: (questions: any[]) => apiRequest('/questions/bulk', {
    method: 'POST',
    body: JSON.stringify({ questions }),
  }),
};

// Attempts API
export const attemptsAPI = {
  getAll: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/attempts${query}`);
  },
  getById: (id: string) => apiRequest(`/attempts/${id}`),
  create: (data: any) => apiRequest('/attempts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAllAdmin: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/attempts/admin/all${query}`);
  },
};

// Feedback API
export const feedbackAPI = {
  getAll: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/feedback${query}`);
  },
  getById: (id: string) => apiRequest(`/feedback/${id}`),
  create: (data: any) => apiRequest('/feedback', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/feedback/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/feedback/${id}`, {
    method: 'DELETE',
  }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/notifications${query}`);
  },
  getUnreadCount: () => apiRequest('/notifications/unread-count'),
  markAsRead: (id: string) => apiRequest(`/notifications/${id}/read`, {
    method: 'PUT',
  }),
  markAllAsRead: () => apiRequest('/notifications/read-all', {
    method: 'PUT',
  }),
  delete: (id: string) => apiRequest(`/notifications/${id}`, {
    method: 'DELETE',
  }),
};

// Subscriptions API
export const subscriptionsAPI = {
  subscribe: (categoryId: string) => apiRequest(`/subscriptions/${categoryId}`, {
    method: 'POST',
  }),
  unsubscribe: (categoryId: string) => apiRequest(`/subscriptions/${categoryId}`, {
    method: 'DELETE',
  }),
  getMySubscriptions: () => apiRequest('/subscriptions/my-subscriptions'),
  checkSubscription: (categoryId: string) => apiRequest(`/subscriptions/check/${categoryId}`),
};

// Users API
export const usersAPI = {
  getAll: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/users${query}`);
  },
  getById: (id: string) => apiRequest(`/users/${id}`),
  update: (id: string, data: any) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateRole: (id: string, role: string) => apiRequest(`/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  }),
  getStats: (id: string) => apiRequest(`/users/${id}/stats`),
  getActivity: (id: string) => apiRequest(`/users/${id}/activity`),
};

export const settingsAPI = {
  get: () => apiRequest('/settings'),
  update: (data: any) => apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getPublic: () => apiRequest('/settings/public'),
  getSystem: () => apiRequest('/settings/system'),
  updateSystem: (data: any) => apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify({ system: data }),
  }),
};

export const paymentsAPI = {
  getSettings: () => apiRequest('/payments/settings'),
  updateSettings: (data: any) => apiRequest('/payments/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  create: (data: any) => apiRequest('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAll: (filters?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/payments${query}`);
  },
  getMyPayments: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/payments/my-payments${query}`);
  },
  verify: (id: string, data: { status: string; notes?: string }) => apiRequest(`/payments/${id}/verify`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  getStats: () => apiRequest('/payments/stats'),
};

export const dashboardAPI = {
  getStats: () => apiRequest('/dashboard/stats'),
};

// Exam Tree API
export const examTreeAPI = {
  getTree: () => apiRequest('/exam-tree'),
};

// Bookmarks API
export const bookmarksAPI = {
  getAll: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/bookmarks${query}`);
  },
  check: (questionId: string) => apiRequest(`/bookmarks/check/${questionId}`),
  toggle: (questionId: string) => apiRequest(`/bookmarks/toggle/${questionId}`, {
    method: 'POST',
  }),
  getWrongAnswers: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/bookmarks/wrong-answers${query}`);
  },
};

// Progress API
export const progressAPI = {
  getAnalytics: () => apiRequest('/progress/analytics'),
  getCutoffComparison: () => apiRequest('/progress/cutoff-comparison'),
  requestClearOTP: () => apiRequest('/progress/clear/request-otp', {
    method: 'POST',
  }),
  clearProgress: (otp: string) => apiRequest('/progress/clear', {
    method: 'POST',
    body: JSON.stringify({ otp }),
  }),
};

// Levels API
export const levelsAPI = {
  getLevelsByTopic: (topicId: string) => apiRequest(`/levels/topic/${topicId}`),
  getLevelContent: (levelId: string) => apiRequest(`/levels/${levelId}/content`),
  getPracticeQuestions: (levelId: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/levels/${levelId}/practice-questions${query}`);
  },
  getSkipTestQuestions: (levelId: string) => apiRequest(`/levels/${levelId}/skip-test-questions`),
  submitSkipTest: (levelId: string, data: any) => apiRequest(`/levels/${levelId}/skip-test`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updatePracticeProgress: (levelId: string, data: any) => apiRequest(`/levels/${levelId}/practice-progress`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getExamWiseProgress: () => apiRequest('/levels/progress/exam-wise'),
};

// Jobs API
export const jobsAPI = {
  getAll: (filters?: {
    category?: string;
    exam_name?: string;
    job_type?: string;
    is_featured?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.exam_name) params.append('exam_name', filters.exam_name);
    if (filters?.job_type) params.append('job_type', filters.job_type);
    if (filters?.is_featured !== undefined) params.append('is_featured', String(filters.is_featured));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/jobs${query}`);
  },
  getById: (id: string) => apiRequest(`/jobs/${id}`),
  create: (data: any) => apiRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/jobs/${id}`, {
    method: 'DELETE',
  }),
  syncAPI: (apiUrl: string, apiKey?: string, apiName?: string) => apiRequest('/jobs/sync-api', {
    method: 'POST',
    body: JSON.stringify({ api_url: apiUrl, api_key: apiKey, api_name: apiName }),
  }),
};

// Materials API
export const materialsAPI = {
  getAll: (filters?: {
    material_type?: string;
    category_id?: string;
    subject_id?: string;
    topic_id?: string;
    level_number?: number;
    page?: number;
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters?.material_type) params.append('material_type', filters.material_type);
    if (filters?.category_id) params.append('category_id', filters.category_id);
    if (filters?.subject_id) params.append('subject_id', filters.subject_id);
    if (filters?.topic_id) params.append('topic_id', filters.topic_id);
    if (filters?.level_number) params.append('level_number', String(filters.level_number));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/materials${query}`);
  },
  getById: (id: string) => apiRequest(`/materials/${id}`),
  create: (data: any) => apiRequest('/materials', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/materials/${id}`, {
    method: 'DELETE',
  }),
  download: (id: string) => apiRequest(`/materials/${id}/download`, {
    method: 'POST',
  }),
};

// Bookmarked Materials API
export const bookmarkedMaterialsAPI = {
  getAll: (materialType?: string, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (materialType) params.append('material_type', materialType);
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/bookmarked-materials${query}`);
  },
  create: (data: any) => apiRequest('/bookmarked-materials', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => apiRequest(`/bookmarked-materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiRequest(`/bookmarked-materials/${id}`, {
    method: 'DELETE',
  }),
  check: (materialType: string, materialId: string) => apiRequest(`/bookmarked-materials/check/${materialType}/${materialId}`),
};

// Upload API
export const uploadAPI = {
  uploadQuestionImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload/question-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to upload image' }));
      throw new Error(error.error || 'Failed to upload image');
    }

    const data = await response.json();
    // Return full URL
    const baseUrl = API_BASE_URL.replace('/api', '');
    return {
      url: `${baseUrl}${data.url}`,
      filename: data.filename,
    };
  },
  uploadMaterialPDF: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await fetch(`${API_BASE_URL}/upload/material-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to upload PDF' }));
      throw new Error(error.error || 'Failed to upload PDF');
    }

    const data = await response.json();
    // Return full URL
    const baseUrl = API_BASE_URL.replace('/api', '');
    return {
      url: `${baseUrl}${data.url}`,
      filename: data.filename,
      size: data.size,
    };
  },
};

// AI API
export const aiAPI = {
  generate: (payload: { type: string, context?: any, count?: number }) => apiRequest('/ai/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
};

