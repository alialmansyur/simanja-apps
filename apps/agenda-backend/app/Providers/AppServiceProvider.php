<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('viewApiDocs', function (User $user) {
            return $user->hasRole('Super Admin')
                || $user->hasRole('Admin')
                || $user->hasRole('super-admin')
                || (bool) ($user->is_super_admin ?? false)
                || ($user->role?->name === 'Super Admin')
                || ($user->role?->name === 'Admin');
        });
    }
}

