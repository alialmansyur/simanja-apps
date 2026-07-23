<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use App\Models\AuditLog;
use App\Http\Resources\UserResource;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles', 'employee.unit']);
        return response()->json([
            'message' => 'Success',
            'data' => new UserResource($user)
        ]);
    }

    /**
     * Update the authenticated user's profile
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('auth_users')->ignore($user->id),
            ],
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        $user->update($validated);

        // Also update Employee record if it exists
        if ($user->ref_employee_id) {
            $user->employee()->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
            ]);
        }

        AuditLog::create([
            'actor_id' => $user->id,
            'module' => 'Profil',
            'action' => 'Update Profil',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'data' => new UserResource($user->fresh(['roles', 'employee.unit']))
        ]);
    }

    /**
     * Upload a new avatar for the user
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $request->user();

        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
                Storage::disk('public')->delete($user->avatar);
            }

            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => $path]);

            AuditLog::create([
                'actor_id' => $user->id,
                'module' => 'Profil',
                'action' => 'Upload Avatar',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);

            return response()->json([
                'message' => 'Foto profil berhasil diunggah',
                'data' => [
                    'avatar' => $path,
                    'avatar_url' => Storage::url($path)
                ]
            ]);
        }

        return response()->json(['message' => 'Tidak ada file yang diunggah'], 400);
    }

    /**
     * Remove the user's avatar
     */
    public function removeAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->update(['avatar' => null]);

        AuditLog::create([
            'actor_id' => $user->id,
            'module' => 'Profil',
            'action' => 'Hapus Avatar',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return response()->json([
            'message' => 'Foto profil berhasil dihapus'
        ]);
    }

    /**
     * Get the user's activity log and login history
     */
    public function activity(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Fetch audit logs for the current user
        $logs = AuditLog::where('actor_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'message' => 'Success',
            'data' => $logs
        ]);
    }
}
