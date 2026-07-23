import axiosInstance from '../../../api/axios';

const userService = {
    getUsers: async (params) => {
        const response = await axiosInstance.get('/users', { params });
        return response.data;
    },

    getUserById: async (id) => {
        const response = await axiosInstance.get(`/users/${id}`);
        return response.data.data;
    },

    createUser: async (data) => {
        const response = await axiosInstance.post('/users', data);
        return response.data.data;
    },

    updateUser: async (id, data) => {
        const response = await axiosInstance.put(`/users/${id}`, data);
        return response.data.data;
    },

    deleteUser: async (id) => {
        const response = await axiosInstance.delete(`/users/${id}`);
        return response.data;
    },

    deleteBulkUsers: async (ids) => {
        const response = await axiosInstance.post('/users/bulk-delete', { ids });
        return response.data;
    },

    updateUserStatus: async (id, isActive) => {
        const response = await axiosInstance.put(`/users/${id}/status`, { is_active: isActive });
        return response.data.data;
    },

    exportUsers: async (params) => {
        const response = await axiosInstance.get('/users/export', { params });
        return response.data;
    },

    resetMfa: async (id) => {
        const response = await axiosInstance.post(`/users/${id}/reset-mfa`);
        return response.data;
    }
};

export default userService;
