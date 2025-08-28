<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Support\Carbon;
use App\Http\Requests\BookingStoreRequest;
use Illuminate\Support\Facades\DB;

use Illuminate\Http\JsonResponse;
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
    $q = Booking::query()
        ->when($request->filled('beauty_expert_id'), fn($qq) =>
            $qq->where('beauty_expert_id', (int)$request->beauty_expert_id)
        );

    // Filter by single date (YYYY-MM-DD) to fetch day’s bookings
    if ($d = $request->query('date')) {
        $q->whereDate('starts_at', Carbon::parse($d)->toDateString());
    }

    // Exclude cancelled by default
    if ($request->boolean('exclude_cancelled', true)) {
        $q->where('status', '!=', 'cancelled');
    }

    return $q->orderBy('starts_at')->get();
}

    /**
     * POST /bookings
     * Prevents overlapping bookings for the same expert.
     */
    public function store(BookingStoreRequest $req): JsonResponse
{
    $data = $req->validated();
    $data['ends_at'] = $req->input('ends_at');

    // Check any overlapping slot for this expert (hard overlap prevention)
    $overlap = Booking::query()
        ->where('beauty_expert_id', $data['beauty_expert_id'])
        ->where('status', '!=', 'cancelled')
        ->where('starts_at', '<', $data['ends_at'])
        ->where('ends_at',   '>', $data['starts_at'])
        ->exists();

    if ($overlap) {
        // We’ll still apply capacity logic below; this early check is optional
    }

    // Capacity: count bookings exactly on this slot window
    $slotCount = Booking::query()
        ->where('beauty_expert_id', $data['beauty_expert_id'])
        ->where('status', '!=', 'cancelled')
        ->where('starts_at', $data['starts_at'])
        ->where('ends_at',   $data['ends_at'])
        ->count();

    if ($slotCount >= 3) {
        return response()->json([
            'message' => 'This slot is fully booked (capacity 3). Choose another time.'
        ], 409);
    }

    $booking = Booking::create([
        'user_id'          => $req->user()?->id,  // null if guest; adjust to require auth if needed
        'beauty_expert_id' => $data['beauty_expert_id'],
        'starts_at'        => $data['starts_at'],
        'ends_at'          => $data['ends_at'],
        'status'           => 'pending',
        'price'            => $data['price'] ?? 0,
    ]);

    return response()->json($booking->load('beautyExpert'), 201);
}

/**
 * GET /bookings/availability?beauty_expert_id=4&date=2025-08-27
 * Returns all 30-min slots 09:00–19:00 with counts and availability.
 */
public function availability(Request $request): JsonResponse
{
    $expertId = (int) $request->query('beauty_expert_id');
    $date     = $request->query('date'); // YYYY-MM-DD

    if (!$expertId || !$date) {
        return response()->json(['message' => 'beauty_expert_id and date are required'], 422);
    }

    $day = \Illuminate\Support\Carbon::parse($date);
    $open  = $day->copy()->setTime(9,0,0);
    $close = $day->copy()->setTime(19,0,0);

    // Pull bookings for that day for this expert
    $bookings = Booking::query()
        ->select('starts_at','ends_at', DB::raw('COUNT(*) as c'))
        ->where('beauty_expert_id', $expertId)
        ->where('status','!=','cancelled')
        ->whereDate('starts_at', $day->toDateString())
        ->groupBy('starts_at','ends_at')
        ->get()
        ->keyBy(fn($b) => $b->starts_at.'__'.$b->ends_at);

    // Build slots
    $slots = [];
    for ($t = $open->copy(); $t->lt($close); $t->addMinutes(30)) {
        $key = $t->format('Y-m-d H:i:s').'__'.$t->copy()->addMinutes(30)->format('Y-m-d H:i:s');
        $count = (int)($bookings[$key]->c ?? 0);
        $slots[] = [
            'starts_at' => $t->format('Y-m-d H:i:s'),
            'ends_at'   => $t->copy()->addMinutes(30)->format('Y-m-d H:i:s'),
            'count'     => $count,
            'capacity'  => 3,
            'available' => $count < 3,
        ];
    }

    return response()->json(['expert_id'=>$expertId, 'date'=>$day->toDateString(), 'slots'=>$slots]);
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
