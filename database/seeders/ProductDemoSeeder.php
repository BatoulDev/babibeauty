<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Brand;
use App\Models\Category;
use Illuminate\Database\Seeder;

class ProductDemoSeeder extends Seeder
{
    public function run(): void
    {
        $count = 20;

        for ($i = 1; $i <= $count; $i++) {
            $name = "Demo Product $i";

            Product::updateOrCreate(
                ['name' => $name], // idempotent by name
                [
                    'brand_id'    => Brand::inRandomOrder()->value('id'),
                    'category_id' => Category::inRandomOrder()->value('id'),
                    'name'        => $name,
                    'description' => 'Demo description',
                    'price'       => rand(5, 90),
                    'stock'       => rand(5, 50),
                   
                    'is_active'   => true,
                ]
            );
        }
    }
}
