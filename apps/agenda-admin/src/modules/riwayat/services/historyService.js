import axiosInstance from '../../../api/axios';

const historyService = {
  getHistory: async (params) => {
    const response = await axiosInstance.get('/history/agendas', { params });
    return response.data.data;
  },
  
  exportHistory: async (params) => {
    const response = await axiosInstance.get('/history/agendas/export', { params });
    return response.data.data;
  }
};

export default historyService;
