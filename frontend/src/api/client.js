import axios from 'axios';
import { auth } from '../config/firebase.js';

const rawBaseURL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';
const baseURL = rawBaseURL.endsWith('/') && rawBaseURL !== '/' ? rawBaseURL.slice(0, -1) : rawBaseURL;

const api = axios.create({
  baseURL,
  timeout: 30000,
});

// Request interceptor to attach verified Firebase ID token
api.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth?.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('[API Client] Could not retrieve Firebase ID token:', err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to normalize error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred. Please verify the backend is running.';
    const normalizedError = new Error(message);
    normalizedError.status = error.response?.status || 500;
    normalizedError.code = error.response?.data?.code || error.code;
    normalizedError.data = error.response?.data;
    return Promise.reject(normalizedError);
  }
);

// ─── API Endpoints ────────────────────────────────────────────────────────────

export const candidateApi = {
  createProfile: (data) => api.post('/candidates', data),
  getMe: () => api.get('/candidates/profile/me'),
  getProfile: (email) => (email ? api.get(`/candidates/${encodeURIComponent(email)}`) : api.get('/candidates/profile/me')),
  updateProfile: (email, data) => (email ? api.patch(`/candidates/${encodeURIComponent(email)}`, data) : api.patch('/candidates/profile/me', data)),
  uploadResume: (email, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    return api.post(`/candidates/${encodeURIComponent(email)}/resume`, formData);
  },
  getResumeMeta: (email) => api.get(`/candidates/${encodeURIComponent(email)}/resume`),
};

export const analysisApi = {
  runAnalysis: (email, data) =>
    api.post(`/analysis/${encodeURIComponent(email)}/run`, data),
  getAnalyses: (email) =>
    api.get(`/analysis/${encodeURIComponent(email)}`),
  getAnalysisById: (email, analysisId) =>
    api.get(`/analysis/${encodeURIComponent(email)}/${analysisId}`),
};

export const roadmapApi = {
  generateRoadmap: (email, data = {}) =>
    api.post(`/roadmaps/${encodeURIComponent(email)}/generate`, data),
  getRoadmaps: (email) =>
    api.get(`/roadmaps/${encodeURIComponent(email)}`),
  getRoadmapById: (email, roadmapId) =>
    api.get(`/roadmaps/${encodeURIComponent(email)}/${roadmapId}`),
  updateMilestone: (email, roadmapId, milestoneId, data) =>
    api.patch(
      `/roadmaps/${encodeURIComponent(email)}/${roadmapId}/milestones/${milestoneId}`,
      data
    ),
};

export const interviewApi = {
  createSession: (email, data = {}) =>
    api.post(`/interviews/${encodeURIComponent(email)}/sessions`, data),
  getSessions: (email) =>
    api.get(`/interviews/${encodeURIComponent(email)}/sessions`),
  getSessionById: (email, sessionId) =>
    api.get(`/interviews/${encodeURIComponent(email)}/sessions/${sessionId}`),
  submitAnswer: (email, sessionId, data) =>
    api.post(
      `/interviews/${encodeURIComponent(email)}/sessions/${sessionId}/answers`,
      data
    ),
  finalizeSession: (email, sessionId) =>
    api.post(
      `/interviews/${encodeURIComponent(email)}/sessions/${sessionId}/finalize`,
      {}
    ),
};

export const systemApi = {
  getHealth: () => api.get('/health'),
};

export default api;
