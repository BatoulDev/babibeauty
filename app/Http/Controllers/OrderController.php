<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

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
}
