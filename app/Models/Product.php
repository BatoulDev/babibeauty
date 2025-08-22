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

    protected $appends = ['image_url'];

    /**
     * Accessor: returns a full public URL for the product image.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image_path) {
            return null;
        }

        // If DB already stores a full URL (http/https), just return it
        if (str_starts_with($this->image_path, 'http://') || str_starts_with($this->image_path, 'https://')) {
            return $this->image_path;
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public'); // maps to storage/app/public

        // Build the proper URL via /storage symlink
        return $disk->url(ltrim($this->image_path, '/'));
    }
}
