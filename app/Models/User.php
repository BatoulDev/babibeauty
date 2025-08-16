<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements FilamentUser
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'is_admin'];
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
        ];
    }

    /**
     * Filament panel access (v4).
     * Return true to allow everyone, or restrict to admins.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        // Only admins:
        // return (bool) $this->is_admin;

        // Everyone (for now):
        return true;
    }

    // Relations
    public function orders(): HasMany { return $this->hasMany(Order::class); }
    public function bookings(): HasMany { return $this->hasMany(Booking::class); }
    public function reviews(): HasMany { return $this->hasMany(Review::class); }
}
