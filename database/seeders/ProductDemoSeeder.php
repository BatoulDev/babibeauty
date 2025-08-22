<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductDemoSeeder extends Seeder
{
    public function run(): void
    {
        // make sure the /storage symlink exists
        // php artisan storage:link (run this once in terminal)

        // 1) Read existing images from storage/app/public/products
        $allFiles = Storage::disk('public')->files('products');

        // keep only image extensions
        $images = array_values(array_filter($allFiles, function ($path) {
            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            return in_array($ext, ['jpg','jpeg','png','webp']);
        }));

        // fallback tiny png if no images found
        $fallbackPng = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=');
        $count = 20;

        for ($i = 1; $i <= $count; $i++) {
            $name = "Demo Product $i";

            if (!empty($images)) {
                // pick an existing image already in storage/app/public/products
                $imagePath = $images[array_rand($images)]; // e.g. "products/xxx.jpg"
            } else {
                // create a tiny placeholder inside public disk
                $newName = 'products/' . Str::slug($name) . '-' . Str::random(6) . '.png';
                Storage::disk('public')->put($newName, $fallbackPng);
                $imagePath = $newName;
            }

            Product::updateOrCreate(
                ['name' => $name],
                [
                    'brand_id'    => Brand::inRandomOrder()->value('id'),
                    'category_id' => Category::inRandomOrder()->value('id'),
                    'description' => 'Demo description',
                    'price'       => rand(5, 90),   // make sure this column is DECIMAL
                    'stock'       => rand(5, 50),
                    'image_path'  => $imagePath,    // ✅ uses your existing files
                    'is_active'   => true,
                ]
            );
        }
    }
}
