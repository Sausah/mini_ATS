import api from './axios';

export const getCandidates = (params = {}) =>
  api.get('', { params, baseURL: api.defaults.baseURL + '/candidates' });

export const getCandidate = (id) =>
  api.get(`/candidates/${id}`);

export const createCandidate = (data) =>
  api.post('/candidates', data);

export const updateCandidate = (id, data) =>
  api.put(`/candidates/${id}`, data);

export const deleteCandidate = (id) =>
  api.delete(`/candidates/${id}`);

export const updateCandidateStage = (id, stage, note = '') =>
  api.patch(`/candidates/${id}/stage`, { stage, note });

export const getCandidateHistory = (id) =>
  api.get(`/candidates/${id}/history`);
