<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $attrs = [
            'name'     => 'Admin',
            'email'    => 'admin@babibeauty.test',
            'password' => Hash::make('ChangeMe123!'),
        ];
        if (Schema::hasColumn('users', 'is_admin')) {
            $attrs['is_admin'] = true;
        }

        User::updateOrCreate(
            ['email' => 'admin@babibeauty.test'],
            $attrs
        );
    }
}
