import api from '../../../api/axios';

export const profileService = {
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  removeAvatar: async () => {
    const response = await api.delete('/profile/avatar');
    return response.data;
  },

  getActivity: async (page = 1) => {
    const response = await api.get(`/profile/activity?page=${page}`);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.post('/change-password', data);
    return response.data;
  },

  setupMfa: async () => {
    const response = await api.get('/mfa/setup');
    return response.data;
  },

  verifyMfa: async (data) => {
    const response = await api.post('/mfa/verify', data);
    return response.data;
  },

  disableMfa: async () => {
    const response = await api.post('/mfa/disable');
    return response.data;
  }
};
