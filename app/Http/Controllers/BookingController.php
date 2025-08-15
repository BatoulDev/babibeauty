<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class BookingController extends Controller
{
    /**
     * GET /bookings
     * Filters:
     *  - ?user_id=1
     *  - ?beauty_expert_id=2
     *  - ?status=pending
     *  - ?date=2025-08-15  (returns bookings that touch this date)
     * Sorting: ?sort=starts_at&dir=asc
     * Pagination: ?page=1&per_page=10
     */
    public function index(Request $request)
    {
        $q = Booking::with(['user','beautyExpert']);

        if ($uid = $request->query('user_id'))          $q->where('user_id', $uid);
        if ($eid = $request->query('beauty_expert_id')) $q->where('beauty_expert_id', $eid);
        if ($st  = $request->query('status'))           $q->where('status', $st);

        if ($date = $request->query('date')) {
            // Any booking that overlaps that day
            $q->whereDate('starts_at', '<=', $date)
              ->whereDate('ends_at',   '>=', $date);
        }

        $sort = in_array($request->query('sort'), ['starts_at','ends_at','price','created_at']) ? $request->query('sort') : 'starts_at';
        $dir  = $request->query('dir') === 'desc' ? 'desc' : 'asc';
        $q->orderBy($sort, $dir);

        $perPage = (int) $request->query('per_page', 10);
        return response()->json($q->paginate($perPage));
    }

    /**
     * POST /bookings
     * Prevents overlapping bookings for the same expert.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'          => ['required','exists:users,id'],
            'beauty_expert_id' => ['required','exists:beauty_experts,id'],
            'starts_at'        => ['required','date'],
            'ends_at'          => ['required','date','after:starts_at'],
            'status'           => ['nullable', Rule::in(['pending','confirmed','completed','cancelled'])],
            'price'            => ['required','numeric','min:0'],
        ]);

        // Overlap check: (existing.starts_at < new.ends_at) AND (existing.ends_at > new.starts_at)
        $overlap = Booking::where('beauty_expert_id', $data['beauty_expert_id'])
            ->where('starts_at', '<', $data['ends_at'])
            ->where('ends_at',   '>', $data['starts_at'])
            ->exists();

        if ($overlap) {
            return response()->json([
                'message' => 'This time slot overlaps with another booking for the selected beauty expert.'
            ], 422);
        }

        $data['status'] = $data['status'] ?? 'pending';

        $booking = Booking::create($data)->load(['user','beautyExpert']);
        return response()->json($booking, Response::HTTP_CREATED);
    }

    /**
     * GET /bookings/{booking}
     */
    public function show(Booking $booking)
    {
        return response()->json($booking->load(['user','beautyExpert']));
    }

    /**
     * PUT/PATCH /bookings/{booking}
     * Also checks overlap if time or expert changes.
     */
    public function update(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'user_id'          => ['sometimes','exists:users,id'],
            'beauty_expert_id' => ['sometimes','exists:beauty_experts,id'],
            'starts_at'        => ['sometimes','date'],
            'ends_at'          => ['sometimes','date','after:starts_at'],
            'status'           => ['sometimes', Rule::in(['pending','confirmed','completed','cancelled'])],
            'price'            => ['sometimes','numeric','min:0'],
        ]);

        // Prepare candidate values for overlap check
        $expertId = $data['beauty_expert_id'] ?? $booking->beauty_expert_id;
        $starts   = $data['starts_at']        ?? $booking->starts_at;
        $ends     = $data['ends_at']          ?? $booking->ends_at;

        // Run overlap check only if expert/time changed
        if ($expertId != $booking->beauty_expert_id || $starts != $booking->starts_at || $ends != $booking->ends_at) {
            $overlap = Booking::where('beauty_expert_id', $expertId)
                ->where('id', '<>', $booking->id)
                ->where('starts_at', '<', $ends)
                ->where('ends_at',   '>', $starts)
                ->exists();

            if ($overlap) {
                return response()->json([
                    'message' => 'This time slot overlaps with another booking for the selected beauty expert.'
                ], 422);
            }
        }

        $booking->update($data);
        return response()->json($booking->fresh()->load(['user','beautyExpert']));
    }

    /**
     * DELETE /bookings/{booking}
     */
    public function destroy(Booking $booking)
    {
        $booking->delete();
        return response()->json(['message' => 'Deleted'], Response::HTTP_NO_CONTENT);
    }
}
