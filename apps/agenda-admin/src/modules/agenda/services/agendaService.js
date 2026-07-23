import axiosInstance from '../../../api/axios';

const agendaService = {
    getUnits: async (params) => {
        const response = await axiosInstance.get('/units', { params });
        return response.data;
    },

    getUnitById: async (uid) => {
        const response = await axiosInstance.get(`/units/${uid}`);
        return response.data.data;
    },

    getUnitAgendas: async (uid, params) => {
        const response = await axiosInstance.get(`/units/${uid}/agendas`, { params });
        return response.data;
    },

    createUnitAgenda: async (uid, data) => {
        const response = await axiosInstance.post(`/units/${uid}/agendas`, data);
        return response.data;
    },

    updateAgendaStatus: async (agendaId, status) => {
        const response = await axiosInstance.put(`/agendas/${agendaId}/status`, { status });
        return response.data;
    },

    updateAgenda: async (agendaId, data) => {
        const response = await axiosInstance.put(`/agendas/${agendaId}`, data);
        return response.data;
    },

    deleteAgenda: async (agendaId) => {
        const response = await axiosInstance.delete(`/agendas/${agendaId}`);
        return response.data;
    },

    getRooms: async () => {
        const response = await axiosInstance.get('/references/rooms');
        return response.data.data;
    },

    getEmployees: async () => {
        const response = await axiosInstance.get('/references/employees');
        return response.data.data;
    },

    getEventTypes: async () => {
        const response = await axiosInstance.get('/references/event-types');
        return response.data.data;
    },

    getOfficerPositions: async () => {
        const response = await axiosInstance.get('/references/officer-positions');
        return response.data.data;
    },

    getEmployeeAvailability: async (params) => {
        const response = await axiosInstance.get('/references/employee-availability', { params });
        return response.data.data;
    },

    getRoomAvailability: async (params) => {
        const response = await axiosInstance.get('/references/room-availability', { params });
        return response.data.data;
    },

    getAgendaCategories: async () => {
        const response = await axiosInstance.get('/references/agenda-categories');
        return response.data.data;
    }
};

export default agendaService;
