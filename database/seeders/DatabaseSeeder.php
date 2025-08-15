<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Core (safe everywhere)
        $this->call([
            AdminUserSeeder::class,
            BrandSeeder::class,
            CategorySeeder::class,
            BeautyExpertSeeder::class,
        ]);

        // Demo (local/testing only)
        if (app()->environment(['local','testing'])) {
            $this->call([
                ProductDemoSeeder::class,
                OrderDemoSeeder::class,
                BookingDemoSeeder::class,
                ReviewDemoSeeder::class,
            ]);
        }
    }
}
