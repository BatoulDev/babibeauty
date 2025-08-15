<?php

namespace Database\Seeders;

use App\Models\BeautyExpert;
use Illuminate\Database\Seeder;

class BeautyExpertSeeder extends Seeder
{
    public function run(): void
    {
        // Seed whatever real experts you want here
        $experts = [
            [
                'name'       => 'Lina Abou Khalil',
                'specialty'  => 'Makeup Artist',
                'bio'        => 'Bridal & soft glam specialist with 6+ years experience.',
                'phone'      => '70123456',
                'is_active'  => true,
            ],
            [
                'name'       => 'Rana Kassab',
                'specialty'  => 'Skincare',
                'bio'        => 'Customized facials, acne treatments, and skin analysis.',
                'phone'      => '71111222',
                'is_active'  => true,
            ],
            [
                'name'       => 'Mira Saade',
                'specialty'  => 'Hair Stylist',
                'bio'        => 'Color corrections, balayage, and bridal hair.',
                'phone'      => '76123456',
                'is_active'  => true,
            ],
            [
                'name'       => 'Jad Tannous',
                'specialty'  => 'Nail Technician',
                'bio'        => 'Gel/BIAB, nail art & hand care.',
                'phone'      => '70876543',
                'is_active'  => true,
            ],
            [
                'name'       => 'Nour Hafez',
                'specialty'  => 'Brow & Lash',
                'bio'        => 'Brow shaping, lamination and lash lifts.',
                'phone'      => '03123456',
                'is_active'  => true,
            ],
            [
                'name'       => 'Sara Chami',
                'specialty'  => 'Massage & Body',
                'bio'        => 'Lymphatic drainage and deep-tissue massage.',
                'phone'      => '76111222',
                'is_active'  => true,
            ],
        ];

        foreach ($experts as $e) {
            // Use name as the unique key; if you prefer phone, switch the first array to ['phone' => $e['phone']]
            BeautyExpert::updateOrCreate(
                ['name' => $e['name']],
                $e
            );
        }
    }
}
