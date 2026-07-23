<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\SettingGroup;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;

class SettingService
{
    public function getAllGroupsWithSettings()
    {
        return SettingGroup::with('settings')->orderBy('order_no')->get();
    }

    public function updateSettings(array $data)
    {
        foreach ($data as $key => $value) {
            $setting = Setting::where('key', $key)->first();
            
            if ($setting) {
                // Handle file uploads if the value is an uploaded file
                if ($setting->type === 'image' && request()->hasFile('settings.'.$key)) {
                    if ($setting->value) {
                        Storage::disk('public')->delete($setting->value);
                    }
                    $path = request()->file('settings.'.$key)->store('settings', 'public');
                    $setting->value = $path;
                } else {
                    // Encrypt password fields like SMTP password
                    if ($setting->type === 'password' && !empty($value)) {
                        $setting->value = Crypt::encryptString($value);
                    } else {
                        // Avoid overwriting password if empty string provided
                        if ($setting->type === 'password' && empty($value)) {
                            continue;
                        }
                        $setting->value = is_array($value) ? json_encode($value) : $value;
                    }
                }
                
                $setting->save();
            }
        }
        
        Cache::forget('app_settings');
        return true;
    }
}
