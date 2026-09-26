<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class AuthorizeDocsAccess
{
    /**
     * Handle an incoming request for Scramble API documentation.
     * Enforces HTTP Basic Authentication and role authorization.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Check if user is already authenticated via session
        if (Auth::check()) {
            $user = Auth::user();
            if ($this->isAuthorizedUser($user)) {
                return $next($request);
            }
            return response('Forbidden: Akses dokumentasi API hanya untuk Super Admin / Admin.', 403);
        }

        // 2. Extract Basic Auth credentials (supports header fallback)
        $username = $request->getUser();
        $password = $request->getPassword();

        if (! $username || ! $password) {
            $authHeader = $request->header('Authorization');
            if ($authHeader && str_starts_with(strtolower($authHeader), 'basic ')) {
                $decoded = base64_decode(substr($authHeader, 6));
                if (str_contains($decoded, ':')) {
                    [$username, $password] = explode(':', $decoded, 2);
                }
            }
        }

        // 3. Challenge with Basic Auth prompt if credentials missing
        if (! $username || ! $password) {
            return $this->challenge();
        }

        // 4. Authenticate against auth_users (via email or employee NIP)
        $user = User::where('email', $username)
            ->orWhereHas('employee', function ($query) use ($username) {
                $query->where('nip', $username);
            })->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return $this->challenge('Kredensial tidak valid.');
        }

        if (! $user->is_active) {
            return response('Unauthorized: Akun tidak aktif.', 401);
        }

        // 5. Authorize role (Super Admin / Admin)
        if (! $this->isAuthorizedUser($user)) {
            return response('Forbidden: Akses dokumentasi API hanya untuk Super Admin / Admin.', 403);
        }

        // Set authenticated user for this request
        Auth::setUser($user);

        return $next($request);
    }

    /**
     * Check whether user has required administrative role.
     */
    protected function isAuthorizedUser(User $user): bool
    {
        return $user->hasRole('Super Admin')
            || $user->hasRole('Admin')
            || $user->hasRole('super-admin')
            || (bool) ($user->is_super_admin ?? false)
            || ($user->role?->name === 'Super Admin')
            || ($user->role?->name === 'Admin');
    }

    /**
     * Return HTTP 401 response with Basic Auth challenge header.
     */
    protected function challenge(?string $message = null): Response
    {
        return response($message ?? 'Autentikasi diperlukan untuk mengakses Dokumentasi API SIMANJA.', 401, [
            'WWW-Authenticate' => 'Basic realm="SIMANJA API Documentation"',
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }
}
