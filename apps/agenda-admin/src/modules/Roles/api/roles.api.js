import axiosInstance from '../../../api/axios';

/**
 * Fetch role permission matrix
 * Returns { roles, permissions_grouped, role_permissions }
 */
export const fetchRolePermissions = async () => {
    const response = await axiosInstance.get('/roles-permissions');
    return response.data.data;
};

/**
 * Toggle a single permission for a role
 * @param {number} roleId 
 * @param {number} permissionId 
 * @param {boolean} assign 
 */
export const toggleRolePermission = async (roleId, permissionId, assign) => {
    const response = await axiosInstance.post('/roles-permissions/toggle', {
        role_id: roleId,
        permission_id: permissionId,
        assign: assign
    });
    return response.data;
};
