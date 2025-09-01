<?php

namespace Database\Seeders;

use App\Models\Review;
use App\Models\User;
use App\Models\Product;
use App\Models\BeautyExpert;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class ReviewDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (!User::exists()) return;

        // Detect column names (supports 'reviewable_*' or 'revieweable_*')
        $typeCol = Schema::hasColumn('reviews', 'reviewable_type')
            ? 'reviewable_type'
            : (Schema::hasColumn('reviews', 'revieweable_type') ? 'revieweable_type' : null);

        $idCol = Schema::hasColumn('reviews', 'reviewable_id')
            ? 'reviewable_id'
            : (Schema::hasColumn('reviews', 'revieweable_id') ? 'revieweable_id' : null);

        if (!$typeCol || !$idCol) {
            // table isn't polymorphic; nothing to seed safely
            return;
        }

        // Build a target list: some products and/or experts (whatever exists)
        $targets = [];

        if (class_exists(Product::class) && Product::exists()) {
            foreach (Product::inRandomOrder()->take(5)->pluck('id') as $pid) {
                $targets[] = [ 'type' => Product::class, 'id' => $pid ];
            }
        }

        if (class_exists(BeautyExpert::class) && BeautyExpert::exists()) {
            foreach (BeautyExpert::inRandomOrder()->take(5)->pluck('id') as $eid) {
                $targets[] = [ 'type' => BeautyExpert::class, 'id' => $eid ];
            }
        }

        if (empty($targets)) return;

        // Pick a few users to write reviews
        $users = User::inRandomOrder()->take(min(8, User::count()))->pluck('id');

        foreach ($targets as $t) {
            // 2–3 reviews per target, one review per (user,target) pair
            $reviewers = $users->shuffle()->take(rand(2, 3));
            foreach ($reviewers as $uid) {
                $where = [
                    'user_id' => $uid,
                    $typeCol  => $t['type'],
                    $idCol    => $t['id'],
                ];

                $data = [
                    'rating'  => rand(3, 5),                           // 1..5
                    'comment' => 'Great experience! ' . fake()->sentence(),
                ];

                Review::updateOrCreate($where, $data);
            }
        }
    }
}
