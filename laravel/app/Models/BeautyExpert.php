<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class BeautyExpert extends Model
{
    use HasFactory;

    protected $fillable = ['name','specialty','bio','phone','is_active'];

    public function bookings(): HasMany { return $this->hasMany(Booking::class); }

    // polymorphic target
    public function reviews(): MorphMany { return $this->morphMany(Review::class, 'reviewable'); }
}
