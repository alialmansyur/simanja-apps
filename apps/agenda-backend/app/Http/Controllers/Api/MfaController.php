<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use App\Models\AuditLog;

class MfaController extends Controller
{
    public function setup(Request $request)
    {
        $user = $request->user();
        $google2fa = new Google2FA();
        
        $secret = $user->two_factor_secret;
        if (!$secret) {
            $secret = $google2fa->generateSecretKey();
            $user->two_factor_secret = $secret;
            $user->save();

            AuditLog::create([
                'actor_id' => $user->id,
                'module' => 'Keamanan',
                'action' => 'Generate MFA Secret',
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        }

        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        $renderer = new ImageRenderer(
            new RendererStyle(200),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $qrCodeSvg = $writer->writeString($qrCodeUrl);

        return $this->successResponse([
            'secret' => $secret,
            'qr_code' => base64_encode($qrCodeSvg)
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6'
        ]);

        $user = $request->user();
        
        if (!$user->tokenCan('mfa_verify') && !$user->tokenCan('*')) {
            return $this->errorResponse('Invalid token.', null, 403);
        }

        $google2fa = new Google2FA();
        $valid = $google2fa->verifyKey($user->two_factor_secret, $request->code);

        if ($valid) {
            if (!$user->two_factor_confirmed_at) {
                $user->two_factor_confirmed_at = now();
                $user->save();

                AuditLog::create([
                    'actor_id' => $user->id,
                    'module' => 'Keamanan',
                    'action' => 'Aktivasi MFA',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                ]);
            } else {
                AuditLog::create([
                    'actor_id' => $user->id,
                    'module' => 'Autentikasi',
                    'action' => 'Verifikasi MFA Berhasil',
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'created_at' => now(),
                ]);
            }

            // Issue full token
            $user->currentAccessToken()->delete();
            $token = $user->createToken('auth_token', ['*'])->plainTextToken;

            return $this->successResponse([
                'token' => $token,
                'user' => new \App\Http\Resources\UserResource($user)
            ], 'MFA Verified');
        }

        return $this->errorResponse('Kode OTP tidak valid.', null, 422);
    }

    public function disable(Request $request)
    {
        $user = $request->user();
        $user->two_factor_secret = null;
        $user->two_factor_confirmed_at = null;
        $user->save();

        AuditLog::create([
            'actor_id' => $user->id,
            'module' => 'Keamanan',
            'action' => 'Nonaktifkan MFA',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        return $this->successResponse(null, 'MFA Dinonaktifkan.');
    }
}
