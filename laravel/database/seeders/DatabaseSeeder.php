<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\App;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Core seeders (run in ALL environments)
        | Keep the order: users/admins -> taxonomy (brands/categories) -> experts
        |--------------------------------------------------------------------------
        */
        $this->call([
            AdminUserSeeder::class,   // creates an admin/user account
            BrandSeeder::class,       // brands used by products
            CategorySeeder::class,    // categories used by products
            BeautyExpertSeeder::class // experts consumed by your booking UI
        ]);

        /*
        |--------------------------------------------------------------------------
        | Demo / sample data (LOCAL & TESTING only)
        | Includes products, orders, bookings, and reviews.
        | BookingDemoSeeder generates ONLY valid 30-min slots within 09:00–19:00.
        |--------------------------------------------------------------------------
        */
        if (App::environment(['local', 'testing'])) {
            $this->call([
                ProductDemoSeeder::class,
                OrderDemoSeeder::class,
                BookingDemoSeeder::class, // depends on users + beauty experts
                ReviewDemoSeeder::class,  // depends on products/experts
            ]);
        }
    }
}
