<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CheckoutController extends Controller
{
    public function create(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'shipping.full_name' => ['required','string','max:255'],
            'shipping.email'     => ['required','email','max:255'],
            'shipping.phone'     => ['nullable','string','max:40'],
            'shipping.address1'  => ['required','string','max:255'],
            'shipping.country'   => ['nullable','string','max:120'],
            'payment_method'     => ['required', Rule::in(['card','cod'])],
            'voucher_code'       => ['nullable','string','max:40'],
        ]);

        // Load user's cart with products
        $items = Cart::with('product:id,stock,price,name')
            ->where('user_id', $user->id)
            ->orderBy('id')
            ->get();

        if ($items->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 422);
        }

        // Totals (same logic as frontend)
        $subtotal = $items->sum(fn($i) => $i->price * $i->quantity);
        $shipping = ($subtotal > 0 && $subtotal < 100) ? 5 : 0;
        $discount = (strtoupper($data['voucher_code'] ?? '') === 'WHEAT10') ? ($subtotal * 0.10) : 0;
        $total    = max(0, $subtotal + $shipping - $discount);

        // Quick stock check before we start
        foreach ($items as $it) {
            $p = $it->product;
            if ($p && !is_null($p->stock) && $p->stock < $it->quantity) {
                return response()->json(['message' => "Insufficient stock for {$p->name}"], 422);
            }
        }

        // Transaction: decrement stock, create order, clear cart
        $order = DB::transaction(function () use ($user, $items, $total) {
            // Decrement stock atomically
            foreach ($items as $it) {
                if (!is_null($it->product?->stock)) {
                    // lock & decrement to avoid races
                    $prod = Product::where('id', $it->product_id)->lockForUpdate()->first();
                    if ($prod->stock < $it->quantity) {
                        abort(422, "Insufficient stock for {$prod->name}");
                    }
                    $prod->decrement('stock', $it->quantity);
                }
            }

            // Create the order (your orders table: id, user_id, status, total, timestamps)
            $order = Order::create([
                'user_id' => $user->id,
                'status'  => 'pending',
                'total'   => $total,
            ]);

            // Clear the cart
            Cart::where('user_id', $user->id)->delete();

            return $order;
        });

        // We’re not integrating Stripe now; just return the order id
        return response()->json([
            'order_id' => $order->id,
            'message'  => 'Order created',
        ], 201);
    }
}
