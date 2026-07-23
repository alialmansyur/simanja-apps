<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SettingService;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    protected $settingService;

    public function __construct(SettingService $settingService)
    {
        $this->settingService = $settingService;
    }

    public function index()
    {
        $groups = $this->settingService->getAllGroupsWithSettings();
        return response()->json([
            'status' => 'success',
            'data' => $groups
        ]);
    }

    public function bulkUpdate(Request $request)
    {
        // Validation could be dynamic, but for now we just take all inputs.
        $this->settingService->updateSettings($request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Settings updated successfully'
        ]);
    }

    public function publicSettings()
    {
        $settings = \App\Models\Setting::where('is_public', true)->get(['key', 'value', 'default_value', 'type']);
        $publicData = [];
        foreach ($settings as $setting) {
            $val = $setting->value ?? $setting->default_value;
            // Handle specific types if needed
            if ($setting->type === 'image' && $val) {
                // If the client needs the full URL, they will prefix it with storage URL
            }
            $publicData[$setting->key] = $val;
        }

        return response()->json([
            'status' => 'success',
            'data' => $publicData
        ]);
    }
}
