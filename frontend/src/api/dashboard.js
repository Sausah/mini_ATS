import api from './axios';

export const getDashboard = () =>
  api.get('/dashboard');

export const getPipeline = () =>
  api.get('/pipeline');
