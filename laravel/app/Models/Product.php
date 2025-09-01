<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Filesystem\FilesystemAdapter; // correct type for ->url()

class Product extends Model
{
    protected $fillable = [
        'brand_id',
        'category_id',
        'name',
        'description',
        'price',
        'stock',
        'is_active',
        'image_path',
    ];

    public function brand()
    {
        return $this->belongsTo(\App\Models\Brand::class);
    }

    public function category()
    {
        return $this->belongsTo(\App\Models\Category::class);
    }

   // app/Models/Product.php
public function reviews()
{
    return $this->morphMany(\App\Models\Review::class, 'reviewable');
}


  
}
