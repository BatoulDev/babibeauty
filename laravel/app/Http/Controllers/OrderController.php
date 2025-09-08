<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Cart; 
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;


class OrderController extends Controller
{
    private const STATUSES = ['pending','paid','shipped','completed','cancelled'];

    /**
     * GET /orders
     * Filters: ?user_id=1&status=pending&date_from=2025-08-01&date_to=2025-08-31
     * Sort: ?sort=created_at|total|status&dir=asc|desc
     * Pagination: ?page=1&per_page=10
     */
    public function index(Request $request)
    {
        $q = Order::with('user');

        if ($uid = $request->query('user_id')) $q->where('user_id', $uid);
        if ($st  = $request->query('status'))  $q->where('status', $st);

        if ($from = $request->query('date_from')) $q->whereDate('created_at', '>=', $from);
        if ($to   = $request->query('date_to'))   $q->whereDate('created_at', '<=', $to);

        $sort = in_array($request->query('sort'), ['created_at','total','status']) ? $request->query('sort') : 'created_at';
        $dir  = $request->query('dir') === 'asc' ? 'asc' : 'desc';
        $q->orderBy($sort, $dir);

        $perPage = (int) $request->query('per_page', 10);
        return response()->json($q->paginate($perPage));
    }

    /**
     * POST /orders
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id' => ['required','exists:users,id'],
            'status'  => ['nullable', Rule::in(self::STATUSES)],
            'total'   => ['required','numeric','min:0'],
        ]);

        $data['status'] = $data['status'] ?? 'pending';

        $order = Order::create($data)->load('user');
        return response()->json($order, Response::HTTP_CREATED);
    }

    /**
     * GET /orders/{order}
     */
    public function show(Order $order)
    {
        return response()->json($order->load('user'));
    }

    /**
     * PUT/PATCH /orders/{order}
     * Partial updates are fine.
     */
    public function update(Request $request, Order $order)
    {
        $data = $request->validate([
            'user_id' => ['sometimes','exists:users,id'],
            'status'  => ['sometimes', Rule::in(self::STATUSES)],
            'total'   => ['sometimes','numeric','min:0'],
        ]);

        $order->update($data);
        return response()->json($order->fresh()->load('user'));
    }

    /**
     * DELETE /orders/{order}
     */
    public function destroy(Order $order)
    {
        $order->delete();
        return response()->json(['message' => 'Deleted'], Response::HTTP_NO_CONTENT);
    }
    public function checkoutSimple(Request $req)
    {
        $user = $req->user();

        $data = $req->validate([
            'items'                => ['required','array','min:1'],
            'items.*.id'           => ['required','integer','distinct'],  // cart row IDs
            'items.*.quantity'     => ['required','integer','min:1'],     // client-requested qty (we’ll cap to >=1)
            'voucher_code'         => ['nullable','string','max:64'],
            'payment_method'       => ['nullable', Rule::in(['card','cod'])],
            // shipping fields optional (ignored if you don't store them)
            'shipping.full_name'   => ['nullable','string','max:255'],
            'shipping.email'       => ['nullable','email','max:255'],
            'shipping.phone'       => ['nullable','string','max:50'],
            'shipping.address1'    => ['nullable','string','max:500'],
            'shipping.country'     => ['nullable','string','max:120'],
        ]);

        $voucher = strtoupper(trim($data['voucher_code'] ?? ''));
        $selectedIds = collect($data['items'])->pluck('id')->unique()->values();
        $qtyById = collect($data['items'])->mapWithKeys(fn($it) => [(int)$it['id'] => (int)$it['quantity']]);

        // Pull the user’s selected rows from carts table
        $cartRows = Cart::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $selectedIds)
            ->lockForUpdate()
            ->get();

        if ($cartRows->isEmpty()) {
            return response()->json(['message' => 'No selected cart items.'], 422);
        }

        // Recompute server-side
        $subtotal = 0.0;
        foreach ($cartRows as $row) {
            $qty   = max(1, (int)($qtyById[$row->id] ?? $row->quantity));
            $price = (float)$row->price;   // price snapshot stored on carts row
            $subtotal += $price * $qty;
        }

        $shippingFee    = ($subtotal > 0 && $subtotal < 100) ? 5.00 : 0.00;
        $discountAmount = ($voucher === 'WHEAT10') ? round($subtotal * 0.10, 2) : 0.00;
        $finalTotal     = max(0, round($subtotal + $shippingFee - $discountAmount, 2)); // e.g., 18.50

        // Create order with just your existing columns
        $order = DB::transaction(function () use ($user, $finalTotal, $cartRows) {
            $order = Order::create([
                'user_id' => $user->id,
                'status'  => 'pending',
                'total'   => $finalTotal,  // <<-- write final number here
            ]);

            // Optional: remove only selected rows from carts
            Cart::whereIn('id', $cartRows->pluck('id'))->delete();

            return $order;
        });

        return response()->json([
            'order_id' => $order->id,
            'total'    => $order->total,
            'status'   => $order->status,
        ], Response::HTTP_CREATED);
    }

    
}
