<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $tops = ['Makeup','Skincare','Haircare','Fragrance','Bath & Body','Nails','Tools & Accessories'];

        foreach ($tops as $name) {
            Category::updateOrCreate(
                ['name' => $name],     // <-- unique key is name
                ['name' => $name]
            );
        }
    }
}
