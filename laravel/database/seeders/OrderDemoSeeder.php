<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class OrderDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (!User::exists()) return;

        $allowed = $this->allowedStatuses(); // detect ENUM options; fallback to safe defaults

        for ($i = 0; $i < 6; $i++) {
            $userId    = User::inRandomOrder()->value('id');
            $createdAt = Carbon::now()->subDays($i)->setTime(12, 0);

            // Build a realistic total from products if available
            $total = 0;
            if (class_exists(Product::class) && Product::exists()) {
                $products = Product::inRandomOrder()->take(rand(1, 3))->get();
                foreach ($products as $p) {
                    $qty   = rand(1, 2);
                    $price = $p->price ?? 0;
                    $total += $price * $qty;
                }
            } else {
                $total = rand(30, 200);
            }

            Order::updateOrCreate(
                ['user_id' => $userId, 'created_at' => $createdAt], // idempotent key
                [
                    'status'     => $allowed[array_rand($allowed)],
                    'total'      => $total,
                    'updated_at' => now(),
                ]
            );
        }
    }

    private function allowedStatuses(): array
    {
        // Try to read ENUM options from MySQL; else use safe defaults
        $col = DB::select("SHOW COLUMNS FROM `orders` LIKE 'status'");
        if ($col && isset($col[0]->Type) && preg_match("/^enum\\((.*)\\)$/i", $col[0]->Type, $m)) {
            $opts = array_map(fn($v) => trim($v, " '"), explode(',', $m[1]));
            if (!empty($opts)) return $opts;
        }
        return ['pending', 'paid', 'cancelled']; // fallback
    }
}
