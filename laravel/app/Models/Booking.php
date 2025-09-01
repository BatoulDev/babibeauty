<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = [
        'user_id',
        'beauty_expert_id',
        'starts_at',
        'ends_at',
        'status',
        'price',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at'   => 'datetime',
        'price'     => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function beautyExpert()
    {
        return $this->belongsTo(\App\Models\BeautyExpert::class);
    }
}
