import api from '../api/api';

const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getProfile: () => api.get('/auth/me')
};

export default authService;
