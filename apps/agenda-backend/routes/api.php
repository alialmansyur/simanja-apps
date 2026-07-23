<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RolePermissionController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\AgendaController;
use App\Http\Controllers\Api\MasterDataController;
use App\Http\Controllers\Api\DashboardController;

Route::post('/login', [AuthController::class, 'login'])->name('login');

// Public Settings
Route::get('settings/public', [\App\Http\Controllers\Api\SettingController::class, 'publicSettings']);

// Public Dashboard
Route::prefix('public/dashboard')->group(function () {
    Route::get('/kpi', [\App\Http\Controllers\Api\PublicDashboardController::class, 'kpi']);
    Route::get('/announcements', [\App\Http\Controllers\Api\PublicDashboardController::class, 'announcements']);
    Route::get('/events', [\App\Http\Controllers\Api\PublicDashboardController::class, 'events']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Profile
    Route::prefix('profile')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ProfileController::class, 'show']);
        Route::put('/', [\App\Http\Controllers\Api\ProfileController::class, 'update']);
        Route::post('/avatar', [\App\Http\Controllers\Api\ProfileController::class, 'uploadAvatar']);
        Route::delete('/avatar', [\App\Http\Controllers\Api\ProfileController::class, 'removeAvatar']);
        Route::get('/activity', [\App\Http\Controllers\Api\ProfileController::class, 'activity']);
    });

    // MFA
    Route::get('/mfa/setup', [\App\Http\Controllers\Api\MfaController::class, 'setup']);
    Route::post('/mfa/verify', [\App\Http\Controllers\Api\MfaController::class, 'verify']);
    Route::post('/mfa/disable', [\App\Http\Controllers\Api\MfaController::class, 'disable']);

    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('/kpi', [DashboardController::class, 'kpi']);
        Route::get('/announcements', [DashboardController::class, 'announcements']);
        Route::get('/events', [DashboardController::class, 'events']);
    });

    // Users
    Route::post('/users/bulk-delete', [UserController::class, 'bulkDestroy']);
    Route::get('/users/export', [UserController::class, 'export']);
    Route::apiResource('users', UserController::class);
    Route::put('/users/{user}/status', [UserController::class, 'updateStatus']);
    Route::post('/users/{user}/reset-mfa', [UserController::class, 'resetMfa']);

    // Rooms
    Route::apiResource('rooms', \App\Http\Controllers\Api\RoomController::class)->only(['index', 'show']);

    // Notulas
    Route::apiResource('notulas', \App\Http\Controllers\Api\NotulaController::class)->parameters(['notulas' => 'notula']);
    Route::delete('/notulas/{uid}/participants/{participantId}', [\App\Http\Controllers\Api\NotulaController::class, 'removeParticipant']);

    // Units & Agendas
    Route::apiResource('units', \App\Http\Controllers\Api\UnitController::class)->only(['index', 'show']);
    Route::get('/units/{unit}/agendas', [\App\Http\Controllers\Api\UnitController::class, 'agendas']);
    Route::post('/units/{unit}/agendas', [\App\Http\Controllers\Api\UnitController::class, 'storeAgenda']);

    Route::get('/agendas', [AgendaController::class, 'index']);
    Route::get('/history/agendas', [AgendaController::class, 'history']);
    Route::get('/history/agendas/export', [AgendaController::class, 'exportHistory']);
    Route::patch('/agendas/{uuid}/status', [AgendaController::class, 'updateStatus']);
    Route::put('/agendas/{uuid}/status', [AgendaController::class, 'updateStatus']);
    Route::get('/test-ping', function() { return response()->json(['message' => 'pong']); });
    Route::post('/notulas/{uid}/participants', [\App\Http\Controllers\Api\NotulaController::class, 'addParticipant']);
    Route::get('/get-token', function() { return response()->json(['token' => \App\Models\User::first()->createToken('test')->plainTextToken]); });
    Route::put('/agendas/{uuid}', [AgendaController::class, 'update']);
    Route::delete('/agendas/{uuid}', [AgendaController::class, 'destroy']);

    // Master Data
    Route::get('master-data/{category}', [MasterDataController::class, 'index']);
    Route::post('master-data/{category}', [MasterDataController::class, 'store']);
    Route::get('master-data/{category}/{id}', [MasterDataController::class, 'show']);
    Route::put('master-data/{category}/{id}', [MasterDataController::class, 'update']);
    Route::delete('master-data/{category}/{id}', [MasterDataController::class, 'destroy']);

    // Settings
    Route::get('settings', [\App\Http\Controllers\Api\SettingController::class, 'index']);
    Route::post('settings/bulk-update', [\App\Http\Controllers\Api\SettingController::class, 'bulkUpdate']);


    // Template Builder
    Route::get('master-data/template-surat/uuid/{uuid}', [\App\Http\Controllers\Api\TemplateBuilderController::class, 'show']);
    Route::put('master-data/template-surat/uuid/{uuid}', [\App\Http\Controllers\Api\TemplateBuilderController::class, 'update']);

    // Roles & Permissions
    Route::get('/roles-permissions', [RolePermissionController::class, 'index']);
    Route::post('/roles-permissions/toggle', [RolePermissionController::class, 'toggle']);

    // Reference Routes
    Route::get('/references/roles', [ReferenceController::class, 'getRoles']);
    Route::get('/references/units', [ReferenceController::class, 'getUnits']);
    Route::get('/references/rooms', [ReferenceController::class, 'getRooms']);
    Route::get('/references/employees', [ReferenceController::class, 'getEmployees']);
    Route::get('/references/event-types', [ReferenceController::class, 'getEventTypes']);
    Route::get('/references/officer-positions', [ReferenceController::class, 'getOfficerPositions']);
    Route::get('/references/employee-availability', [ReferenceController::class, 'getEmployeeAvailability']);
    Route::get('/references/room-availability', [ReferenceController::class, 'getRoomAvailability']);
    Route::get('/references/agenda-categories', [ReferenceController::class, 'getAgendaCategories']);
});
