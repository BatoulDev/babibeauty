<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\User;
use App\Models\BeautyExpert;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class BookingDemoSeeder extends Seeder
{
    public function run(): void
    {
        // need at least 1 user and 1 expert
        if (!User::exists() || !BeautyExpert::exists()) return;

        $statuses = ['pending','confirmed','cancelled']; // tweak to match your allowed values

        for ($i = 0; $i < 12; $i++) {
            $expertId = BeautyExpert::inRandomOrder()->value('id');
            $userId   = User::inRandomOrder()->value('id');

            // appointment time
            $start = Carbon::now()
                ->addDays(rand(1, 14))
                ->setTime(rand(10, 19), [0, 30][array_rand([0, 1])]); // 10:00–19:30
            $duration = [30, 45, 60, 90][array_rand([0, 1, 2, 3])];
            $end = (clone $start)->addMinutes($duration);

            // simple price rule
            $base = [15, 20, 25, 30][array_rand([0,1,2,3])];
            $price = $base + ($duration >= 60 ? 10 : 0);

            // use unique key (expert + starts_at) to avoid duplicates on reseed
            Booking::updateOrCreate(
                [
                    'beauty_expert_id' => $expertId,
                    'starts_at'        => $start,
                ],
                [
                    'user_id'          => $userId,
                    'ends_at'          => $end,
                    'status'           => $statuses[array_rand($statuses)],
                    'price'            => $price,
                ]
            );
        }
    }
}
