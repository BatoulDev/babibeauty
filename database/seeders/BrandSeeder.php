<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $names = ['L’Oréal', 'Maybelline', 'Sephora', 'NYX', 'Huda Beauty'];

        foreach ($names as $name) {
            Brand::updateOrCreate(
                ['name' => $name],   // unique key is name
                ['name' => $name]
            );
        }
    }
}
