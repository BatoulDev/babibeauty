<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    // GET /api/cart
    public function index(Request $request)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $userId = $request->user()->id;

        // استعمل الأعمدة الموجودة فعلياً بجدول products
        $items = Cart::with('product:id,name,price,image_path')

            ->where('user_id', $userId)
            ->orderByDesc('id')
            ->get();

        $subtotal = $items->sum(fn($i) => $i->price * $i->quantity);

        return response()->json([
            'items'    => $items,
            'subtotal' => round($subtotal, 2),
            'count'    => $items->sum('quantity'),
        ]);
    }

    // POST /api/cart
    public function store(Request $request)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'product_id' => ['required','integer','exists:products,id'],
            'quantity'   => ['nullable','integer','min:1'],
        ]);

        $qty = (int)($data['quantity'] ?? 1);
        $userId = $request->user()->id;

        $product = Product::select('id','price','stock','name')->findOrFail($data['product_id']);

        if ($product->stock !== null && $product->stock < $qty) {
            return response()->json(['message' => 'Insufficient stock for this product.'], 422);
        }

        $item = DB::transaction(function () use ($userId, $product, $qty) {
            $existing = Cart::where('user_id', $userId)
                ->where('product_id', $product->id)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                $existing->quantity += $qty;
                $existing->price = $product->price;
                $existing->save();
                return $existing;
            }

            return Cart::create([
                'user_id'    => $userId,
                'product_id' => $product->id,
                'price'      => $product->price,
                'quantity'   => $qty,
            ]);
        });

        return response()->json(['message' => 'Added to cart.', 'item' => $item], Response::HTTP_CREATED);
    }

    // PATCH /api/cart/{cart}
    public function update(Request $request, Cart $cart)
    {
        if ($cart->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'quantity' => ['required','integer','min:1'],
        ]);

        $cart->update(['quantity' => $data['quantity']]);

        return response()->json(['message' => 'Quantity updated.', 'item' => $cart->fresh()]);
    }

    // DELETE /api/cart/{cart}
    public function destroy(Request $request, Cart $cart)
    {
        if ($cart->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $cart->delete();
        return response()->json(['message' => 'Item removed.']);
    }

    // DELETE /api/cart
    public function clear(Request $request)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        Cart::where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'Cart cleared.']);
    }
}
