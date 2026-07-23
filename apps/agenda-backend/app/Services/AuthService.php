<?php

namespace App\Services;

use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Authenticate user and return token
     *
     * @param array $credentials
     * @return array
     * @throws ValidationException
     */
    public function login(array $credentials): array
    {
        $loginId = $credentials['email']; // It might be email or NIP
        
        $user = User::where('email', $loginId)
            ->orWhereHas('employee', function ($query) use ($loginId) {
                $query->where('nip', $loginId);
            })->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            if ($user) {
                AuditLog::create([
                    'actor_id' => $user->id,
                    'module' => 'Autentikasi',
                    'action' => 'Login Gagal',
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'created_at' => now(),
                ]);
            }
            throw ValidationException::withMessages([
                'email' => ['NIP / Email atau Password tidak cocok dengan catatan kami.'],
            ]);
        }

        // Check if MFA is required
        $mfaEnabledSetting = \App\Models\Setting::where('key', 'mfa.enabled')->first();
        $mfaEnabled = $mfaEnabledSetting ? filter_var($mfaEnabledSetting->value, FILTER_VALIDATE_BOOLEAN) : false;
        
        $mfaRolesSetting = \App\Models\Setting::where('key', 'mfa.required_for_roles')->first();
        $mfaRoles = $mfaRolesSetting ? (json_decode($mfaRolesSetting->value, true) ?? []) : [];
        $isMfaRequiredByRole = in_array($user->role->name ?? '', $mfaRoles);
        
        if ($mfaEnabled && ($isMfaRequiredByRole || $user->two_factor_secret)) {
            // Return temporary token for MFA
            $tempToken = $user->createToken('mfa_temp_token', ['mfa_verify'])->plainTextToken;
            return [
                'user' => $user,
                'token' => $tempToken,
                'requires_mfa' => true,
                'mfa_setup_required' => empty($user->two_factor_secret)
            ];
        }

        // Revoke existing tokens for single session per device, or just create new one
        $user->tokens()->delete(); // Optional: remove this if multiple logins are allowed

        $token = $user->createToken('auth_token', ['*'])->plainTextToken;

        AuditLog::create([
            'actor_id' => $user->id,
            'module' => 'Autentikasi',
            'action' => 'Login Berhasil',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);

        return [
            'user' => $user,
            'token' => $token,
            'requires_mfa' => false,
        ];
    }

    /**
     * Logout user by revoking current token
     *
     * @param User $user
     * @return void
     */
    public function logout(User $user): void
    {
        AuditLog::create([
            'actor_id' => $user->id,
            'module' => 'Autentikasi',
            'action' => 'Logout',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
        $user->currentAccessToken()->delete();
    }

    /**
     * Change user password
     *
     * @param User $user
     * @param string $newPassword
     * @return void
     */
    public function changePassword(User $user, string $newPassword): void
    {
        $user->update([
            'password' => Hash::make($newPassword)
        ]);
        
        AuditLog::create([
            'actor_id' => $user->id,
            'module' => 'Profil',
            'action' => 'Ubah Password',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);

        // Revoke other tokens so they have to login again everywhere
        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
    }
}
