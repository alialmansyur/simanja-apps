import axiosInstance from '../../../api/axios';

export const roomService = {
  getRooms: async (params) => {
    const response = await axiosInstance.get('/rooms', { params });
    return response.data;
  },

  getRoomByUid: async (uid) => {
    const response = await axiosInstance.get(`/rooms/${uid}`);
    return response.data;
  },
};
