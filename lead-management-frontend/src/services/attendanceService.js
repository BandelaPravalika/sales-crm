import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const attendanceService = {
  clockIn: async (lat, lng, accuracy, deviceId) => {
    const response = await axios.post(`${API_URL}/attendance/clock-in`, {
      lat, lng, accuracy, deviceId
    }, { headers: getAuthHeader() });
    return response.data;
  },

  trackLocation: async (lat, lng, accuracy, deviceId) => {
    const response = await axios.post(`${API_URL}/attendance/track`, {
      lat, lng, accuracy, deviceId
    }, { headers: getAuthHeader() });
    return response.data;
  },

  clockOut: async () => {
    const response = await axios.put(`${API_URL}/attendance/clock-out`, {}, { headers: getAuthHeader() });
    return response.data;
  },

  getStatus: async () => {
    const response = await axios.get(`${API_URL}/attendance/status`, { headers: getAuthHeader() });
    return response.data;
  },

  getMyLogs: async () => {
    const response = await axios.get(`${API_URL}/attendance/my-logs`, { headers: getAuthHeader() });
    return response.data;
  },

  getAdminSummaries: async (date, userId) => {
    const params = {};
    if (date) params.date = date;
    if (userId) params.userId = userId;
    const response = await axios.get(`${API_URL}/admin/attendance/summaries`, { 
      params, 
      headers: getAuthHeader() 
    });
    return response.data;
  },
  
  startBreak: async (type = 'SHORT') => {
    const response = await axios.post(`${API_URL}/attendance/break/start?type=${type}`, {}, { headers: getAuthHeader() });
    return response.data;
  },

  endBreak: async () => {
    const response = await axios.post(`${API_URL}/attendance/break/end`, {}, { headers: getAuthHeader() });
    return response.data;
  }
};

export default attendanceService;
