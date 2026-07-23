<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user()->hasRole('Super Admin') && !$request->user()->hasPermissionTo('view_users')) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        $query = User::with(['roles', 'employee.unit']);

        // Search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by Role
        if ($request->has('role') && $request->role !== 'Semua') {
            $query->role($request->role);
        }

        // Filter by Status
        if ($request->has('status') && $request->status !== 'Semua') {
            $isActive = $request->status === 'Aktif' ? 1 : 0;
            $query->where('is_active', $isActive);
        }

        // Sorting
        $sortKey = $request->get('sortKey', 'name');
        $sortDirection = $request->get('sortDirection', 'asc');
        $query->orderBy($sortKey, $sortDirection);

        $pageSize = $request->get('pageSize', 10);
        
        return $this->successResponse([
            'items' => UserResource::collection($query->paginate($pageSize)->items()),
            'total' => $query->paginate($pageSize)->total(),
            'current_page' => $query->paginate($pageSize)->currentPage(),
            'last_page' => $query->paginate($pageSize)->lastPage(),
            'per_page' => $query->paginate($pageSize)->perPage(),
        ]);
    }

    public function show(Request $request, User $user)
    {
        if (!$request->user()->hasRole('Super Admin') && !$request->user()->hasPermissionTo('view_users')) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        $user->load(['roles', 'employee.unit']);
        return $this->successResponse(new UserResource($user));
    }

    public function store(UserRequest $request)
    {
        if (!$request->user()->hasRole('Super Admin') && !$request->user()->hasPermissionTo('create_users')) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        try {
            DB::beginTransaction();

            $employee = null;
            if ($request->unit_id) {
                $employee = Employee::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'ref_unit_id' => $request->unit_id,
                ]);
            }

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'is_active' => $request->has('is_active') ? $request->is_active : true,
                'ref_employee_id' => $employee ? $employee->id : null,
            ]);

            $user->assignRole($request->role);

            DB::commit();

            return $this->successResponse(new UserResource($user), 'User created successfully', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to create user', $e->getMessage(), 500);
        }
    }

    public function update(UserRequest $request, User $user)
    {
        if (!$request->user()->hasRole('Super Admin') && !$request->user()->hasPermissionTo('update_users')) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        try {
            DB::beginTransaction();

            $userData = [
                'name' => $request->name,
                'email' => $request->email,
            ];

            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }

            if ($request->has('is_active')) {
                $userData['is_active'] = $request->is_active;
            }

            $user->update($userData);

            // Update Employee or create if not exists
            if ($request->unit_id) {
                if ($user->ref_employee_id) {
                    $employee = Employee::find($user->ref_employee_id);
                    if ($employee) {
                        $employee->update([
                            'name' => $request->name,
                            'email' => $request->email,
                            'ref_unit_id' => $request->unit_id,
                        ]);
                    }
                } else {
                    $employee = Employee::create([
                        'name' => $request->name,
                        'email' => $request->email,
                        'ref_unit_id' => $request->unit_id,
                    ]);
                    $user->update(['ref_employee_id' => $employee->id]);
                }
            }

            $user->syncRoles([$request->role]);

            DB::commit();

            return $this->successResponse(new UserResource($user), 'User updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to update user', $e->getMessage(), 500);
        }
    }

    public function destroy(Request $request, User $user)
    {
        if (!$request->user()->hasRole('Super Admin') && !$request->user()->hasPermissionTo('delete_users')) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        try {
            if ($user->ref_employee_id) {
                Employee::where('id', $user->ref_employee_id)->delete();
            }
            $user->delete();
            
            return $this->successResponse(null, 'User deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to delete user', $e->getMessage(), 500);
        }
    }

    public function updateStatus(Request $request, User $user)
    {
        if (!$request->user()->hasRole('Super Admin') && !$request->user()->hasPermissionTo('update_users')) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        $request->validate([
            'is_active' => 'required|boolean'
        ]);

        $user->update(['is_active' => $request->is_active]);

        return $this->successResponse(new UserResource($user), 'User status updated successfully');
    }

    public function resetMfa(Request $request, User $user)
    {
        if (!$request->user()->hasRole('Super Admin') && !$request->user()->hasPermissionTo('update_users')) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        try {
            $user->two_factor_secret = null;
            $user->two_factor_confirmed_at = null;
            $user->save();
            
            return $this->successResponse(null, 'MFA pengguna berhasil direset');
        } catch (\Exception $e) {
            return $this->errorResponse('Gagal reset MFA pengguna', $e->getMessage(), 500);
        }
    }

    public function export(Request $request)
    {
        if (!$request->user()->hasRole('Super Admin') && !$request->user()->hasPermissionTo('view_users')) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        $query = User::with(['roles', 'employee.unit']);

        // Search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by Role
        if ($request->has('role') && $request->role !== 'Semua') {
            $query->role($request->role);
        }

        // Filter by Status
        if ($request->has('status') && $request->status !== 'Semua') {
            $isActive = $request->status === 'Aktif' ? 1 : 0;
            $query->where('is_active', $isActive);
        }

        // Sorting
        $sortKey = $request->get('sortKey', 'name');
        $sortDirection = $request->get('sortDirection', 'asc');
        $query->orderBy($sortKey, $sortDirection);

        return $this->successResponse(UserResource::collection($query->get()));
    }

    public function bulkDestroy(Request $request)
    {
        if (!$request->user()->hasRole('Super Admin') && !$request->user()->hasPermissionTo('delete_users')) {
            return $this->errorResponse('Unauthorized', null, 403);
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:auth_users,id'
        ]);

        try {
            DB::beginTransaction();
            $users = User::whereIn('id', $request->ids)->get();
            foreach ($users as $user) {
                if ($user->ref_employee_id) {
                    Employee::where('id', $user->ref_employee_id)->delete();
                }
                $user->delete();
            }
            DB::commit();
            return $this->successResponse(null, 'Users deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to delete users', $e->getMessage(), 500);
        }
    }
}
