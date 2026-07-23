import axios from './axios';

export const fetchMasterData = async (category) => {
  const response = await axios.get(`/master-data/${category}`);
  return response.data.data;
};

export const createMasterData = async (category, payload) => {
  const response = await axios.post(`/master-data/${category}`, payload);
  return response.data.data;
};

export const updateMasterData = async (category, id, payload) => {
  const response = await axios.put(`/master-data/${category}/${id}`, payload);
  return response.data.data;
};

export const deleteMasterData = async (category, id) => {
  const response = await axios.delete(`/master-data/${category}/${id}`);
  return response.data;
};
