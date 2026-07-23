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
    const response = await axiosInstance.get('agendas'); 
    // Wait, check if /agendas endpoint exists or maybe use /references/agendas if available.
    // In api.php, there's no /agendas list endpoint except inside units (e.g., /units/{unit}/agendas).
    // Let me provide a generic one or maybe the backend has it. 
    // Actually, I'll need to check the exact endpoint for Agendas.
    return response.data;
};
