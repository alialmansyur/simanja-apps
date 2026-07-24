import axiosInstance from './axios';

export const getNotulas = async (params = {}) => {
    const response = await axiosInstance.get('notulas', { params });
    return response.data;
};

export const getNotula = async (uid) => {
    const response = await axiosInstance.get(`notulas/${uid}`);
    return response.data;
};

export const createNotula = async (data) => {
    const response = await axiosInstance.post('notulas', data);
    return response.data;
};

export const updateNotula = async (uid, data) => {
    const response = await axiosInstance.put(`notulas/${uid}`, data);
    return response.data;
};

export const deleteNotula = async (uid) => {
    const response = await axiosInstance.delete(`notulas/${uid}`);
    return response.data;
};

export const addNotulaParticipant = async (uid, data) => {
    const response = await axiosInstance.post(`notulas/${uid}/participants`, data);
    return response.data;
};

export const removeNotulaParticipant = async (uid, participantId) => {
    const response = await axiosInstance.delete(`notulas/${uid}/participants/${participantId}`);
    return response.data;
};

export const getAgendas = async () => {
    const response = await axiosInstance.get(`agendas?_t=${Date.now()}`); 
    return response.data;
};
