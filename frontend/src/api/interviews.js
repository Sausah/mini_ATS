import api from './axios';

export const getInterviews = async (params) => {
  return await api.get('/interviews', { params });
};

export const scheduleInterview = async (data) => {
  return await api.post('/interviews', data);
};

export const updateInterview = async (id, data) => {
  return await api.put(`/interviews/${id}`, data);
};

export const deleteInterview = async (id) => {
  return await api.delete(`/interviews/${id}`);
};

export const resendInterviewEmail = async (id) => {
  return await api.post(`/interviews/${id}/resend-email`);
};
