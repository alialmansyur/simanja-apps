import axiosInstance from '../../../api/axios';

const referenceService = {
    getRoles: async () => {
        const response = await axiosInstance.get('/references/roles');
        return response.data.data;
    },

    getUnits: async () => {
        const response = await axiosInstance.get('/references/units');
        return response.data.data;
    }
};

export default referenceService;
