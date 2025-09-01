<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\User;
use App\Models\BeautyExpert;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class BookingDemoSeeder extends Seeder
{
    public function run(): void
    {
        $tz = config('app.timezone', 'UTC');

        /* ----------------------------------------------------
         | Ensure some users & experts exist
         ---------------------------------------------------- */
        if (!User::exists()) {
            User::factory()->count(3)->create();
        }

        if (!BeautyExpert::exists()) {
            // Minimal columns your UI expects: name, specialty, base_price, avatar_path
            BeautyExpert::insert([
                [
                    'name' => 'Maya Khalil',
                    'specialty' => 'Makeup',
                    'base_price' => 30,
                    'avatar_path' => 'experts/maya.jpg',
                    'created_at' => now(), 'updated_at' => now(),
                ],
                [
                    'name' => 'Rita Nassar',
                    'specialty' => 'Haircare',
                    'base_price' => 25,
                    'avatar_path' => 'experts/rita.jpg',
                    'created_at' => now(), 'updated_at' => now(),
                ],
                [
                    'name' => 'Nour Haddad',
                    'specialty' => 'Skincare',
                    'base_price' => 35,
                    'avatar_path' => 'experts/nour.jpg',
                    'created_at' => now(), 'updated_at' => now(),
                ],
                [
                    'name' => 'Layla Fares',
                    'specialty' => 'Nails',
                    'base_price' => 20,
                    'avatar_path' => 'experts/layla.jpg',
                    'created_at' => now(), 'updated_at' => now(),
                ],
            ]);
        }

        /* ----------------------------------------------------
         | Seed valid 30-min bookings within working hours
         ---------------------------------------------------- */
        $statuses = ['pending','confirmed','cancelled','completed']; // allowed set
        $users    = User::pluck('id')->all();
        $experts  = BeautyExpert::pluck('id','id')->keys()->all();

        if (empty($users) || empty($experts)) {
            $this->command?->warn('No users or experts found; skipping booking seed.');
            return;
        }

        // Helper: all valid 30-min starts between 09:00 and 18:30
        $validStarts = static function (string $date, string $tz) : array {
            $start = Carbon::createFromFormat('Y-m-d H:i:s', "$date 09:00:00", $tz);
            $close = Carbon::createFromFormat('Y-m-d H:i:s', "$date 19:00:00", $tz);
            $slots = [];
            for ($t = $start->copy(); $t->lt($close); $t->addMinutes(30)) {
                // latest start is 18:30 (so end is 19:00)
                if ($t->format('H:i') <= '18:30') {
                    $slots[] = $t->copy();
                }
            }
            return $slots;
        };

        // Generate bookings for next 14 days
        for ($day = 0; $day < 14; $day++) {
            $date = Carbon::now($tz)->startOfDay()->addDays($day)->toDateString();
            $slotPool = $validStarts($date, $tz);

            // sprinkle ~12 bookings per day across experts
            for ($i = 0; $i < 12; $i++) {
                $expertId = $experts[array_rand($experts)];
                $userId   = $users[array_rand($users)];
                if (!$slotPool) break;

                /** @var \Illuminate\Support\Carbon $start */
                $start = $slotPool[array_rand($slotPool)]->copy()->second(0);
                $end   = $start->copy()->addMinutes(30)->second(0);

                // Capacity: max 3 per SAME starts_at (pending/confirmed)
                $countAtStart = Booking::where('beauty_expert_id', $expertId)
                    ->where('starts_at', $start->format('Y-m-d H:i:s'))
                    ->whereIn('status', ['pending','confirmed'])
                    ->count();

                if ($countAtStart >= 3) {
                    // pick another slot
                    continue;
                }

                // Create (allow multiple users same start; avoid duplicate for same user+slot)
                Booking::updateOrCreate(
                    [
                        'beauty_expert_id' => $expertId,
                        'user_id'          => $userId,
                        'starts_at'        => $start->format('Y-m-d H:i:s'),
                    ],
                    [
                        'ends_at'          => $end->format('Y-m-d H:i:s'),
                        'status'           => $statuses[array_rand($statuses)],
                        // use expert base_price if available; fallback 25
                        'price'            => optional(BeautyExpert::find($expertId))->base_price ?? 25,
                    ]
                );
            }
        }

        $this->command?->info('BookingDemoSeeder: seeded valid 30-minute bookings within 09:00–19:00 with capacity checks.');
    }
}
