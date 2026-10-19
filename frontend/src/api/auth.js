import api from './axios';

export const loginApi = async (email, password) => {
  return await api.post('/auth/login', { email, password });
};

export const getMeApi = async () => {
  return await api.get('/auth/me');
};
