<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RolePermissionController extends Controller
{
    /**
     * Get the permission matrix data
     */
    public function index(): JsonResponse
    {
        // Fetch all active roles
        $roles = Role::orderBy('id')
            ->get(['id', 'name']);
        
        // Fetch all permissions
        $permissions = Permission::all(['id', 'name']);
        
        // Group permissions by parsing the name (e.g. view_dashboard -> dashboard)
        $groupedPermissions = $permissions->groupBy(function($item) {
            $parts = explode('_', $item->name);
            return count($parts) > 1 ? $parts[1] : $item->name;
        });

        // Create a mapping of role_id => array of assigned permission IDs
        $rolePermissions = [];
        foreach ($roles as $role) {
            $rolePermissions[$role->id] = $role->permissions()->pluck('auth_permissions.id')->toArray();
        }

        return response()->json([
            'message' => 'Success',
            'data' => [
                'roles' => $roles,
                'permissions_grouped' => $groupedPermissions,
                'role_permissions' => $rolePermissions,
            ]
        ]);
    }

    /**
     * Toggle a single permission for a role
     */
    public function toggle(Request $request): JsonResponse
    {
        $request->validate([
            'role_id' => 'required|exists:auth_roles,id',
            'permission_id' => 'required|exists:auth_permissions,id',
            'assign' => 'required|boolean',
        ]);

        $role = Role::findOrFail($request->role_id);
        $permission = Permission::findOrFail($request->permission_id);

        if ($role->name === 'Super Admin') {
            if (!$request->assign) {
                return response()->json([
                    'message' => 'Tidak dapat mencabut hak akses dari Super Admin'
                ], 403);
            }
        }

        if ($request->assign) {
            $role->permissions()->syncWithoutDetaching([$permission->id]);
        } else {
            $role->permissions()->detach($permission->id);
        }

        return response()->json([
            'message' => 'Permission updated successfully',
        ]);
    }
}
