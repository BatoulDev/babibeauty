<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = ['user_id','rating','comment','reviewable_type','reviewable_id'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    // polymorphic inverse
    public function reviewable(): MorphTo { return $this->morphTo(); }
}
