<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Illuminate\Support\Carbon;
use App\Http\Requests\BookingStoreRequest;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    /* ------------------------- INDEX ------------------------- */
    public function index(Request $request)
    {
        $q = Booking::query()
            ->when($request->filled('user_id'), fn ($qq) =>
                $qq->where('user_id', (int) $request->user_id))
            ->when($request->filled('beauty_expert_id'), fn ($qq) =>
                $qq->where('beauty_expert_id', (int) $request->beauty_expert_id))
            ->when($request->filled('status'), fn ($qq) =>
                $qq->where('status', $request->status));

        if ($d = $request->query('date')) {
            $q->whereDate('starts_at', Carbon::parse($d)->toDateString());
        }

        if ($request->boolean('exclude_cancelled', true)) {
            $q->where('status', '!=', 'cancelled');
        }

        $sort = $request->query('sort', 'starts_at');
        $dir  = $request->query('dir', 'asc');

        $q->orderBy($sort, $dir);

        if ($per = (int) $request->query('per_page', 0)) {
            $per = max(1, min($per, 100));
            return $q->paginate($per);
        }

        return $q->get();
    }

    /* ---------------------- AVAILABILITY --------------------- */
    public function availability(Request $request)
    {
        $validated = $request->validate([
            'beauty_expert_id' => ['required', 'integer', 'exists:beauty_experts,id'],
            'date'             => ['required', 'date_format:Y-m-d'],
        ]);

        $expertId = (int) $validated['beauty_expert_id'];
        $date     = $validated['date'];
        $capacity = 3;

        $tz    = config('app.timezone'); // e.g. 'Asia/Beirut'
        $open  = Carbon::createFromFormat('Y-m-d H:i:s', "$date 09:00:00", $tz);
        $close = Carbon::createFromFormat('Y-m-d H:i:s', "$date 19:00:00", $tz);

        $counts = Booking::query()
            ->select('starts_at', DB::raw('COUNT(*) as cnt'))
            ->where('beauty_expert_id', $expertId)
            ->whereDate('starts_at', $date)
            ->whereIn('status', ['pending','confirmed'])
            ->groupBy('starts_at')
            ->pluck('cnt', 'starts_at');

        $slots = [];
        for ($t = $open->copy(); $t->lt($close); $t->addMinutes(30)) {
            $start = $t->copy()->second(0);
            $end   = $t->copy()->addMinutes(30)->second(0);
            $key   = $start->format('Y-m-d H:i:s');
            $cnt   = (int) ($counts[$key] ?? 0);

            $slots[] = [
                'starts_at' => $key,
                'ends_at'   => $end->format('Y-m-d H:i:s'),
                'count'     => $cnt,
                'capacity'  => $capacity,
                'available' => $cnt < $capacity,
            ];
        }

        return response()->json(['slots' => $slots]);
    }

    /* ------------------ ALIGNMENT HELPER --------------------- */
    private function isAlignedTo30(Carbon $t): bool
    {
        // seconds already normalized to 0; enforce minutes only
        $m = (int) $t->format('i');
        return $m === 0 || $m === 30;
    }

    /* -------------------------- STORE ------------------------ */
   public function store(BookingStoreRequest $request)
{
    $user  = $request->user(); // Sanctum user
    $data  = $request->validated();

    $tz    = config('app.timezone');
    $start = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $data['starts_at'], $tz)->second(0);
    $end   = $start->copy()->addMinutes(30)->second(0); // always compute

    $date  = $start->toDateString();
    $open  = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', "$date 09:00:00", $tz);
    $close = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', "$date 19:00:00", $tz);

    // Grid + hours (should already be validated; keep as guard)
    if ($start->lt($open) || $end->gt($close) ||
        !in_array((int)$start->format('i'), [0,30], true) ||
        !in_array((int)$end->format('i'), [0,30], true)) {
        return response()->json([
            'message' => 'Slot must be aligned to :00 or :30, within 09:00–19:00.',
        ], 422);
    }

    // Capacity: max 3 per starts_at
    $existing = Booking::where('beauty_expert_id', $data['beauty_expert_id'])
        ->where('starts_at', $start->format('Y-m-d H:i:s'))
        ->whereIn('status', ['pending','confirmed'])
        ->count();

    if ($existing >= 3) {
        return response()->json(['message' => 'This time is full. Choose another slot.'], 409);
    }

    $booking = Booking::create([
        'user_id'          => $user->id,
        'beauty_expert_id' => $data['beauty_expert_id'],
        'starts_at'        => $start,
        'ends_at'          => $end,
        'status'           => 'pending',
        'price'            => $data['price'] ?? 0,
    ]);

    return response()->json(['message' => 'Booked', 'data' => $booking], 201);
}

    /* -------------------------- SHOW ------------------------- */
    public function show(Booking $booking)
    {
        return response()->json($booking->load(['user','beautyExpert']));
    }

    /* ------------------------- UPDATE ------------------------ */
    public function update(Request $request, Booking $booking)
    {
        $data = $request->validate([
            'beauty_expert_id' => ['sometimes','integer','exists:beauty_experts,id'],
            'starts_at'        => ['sometimes','date_format:Y-m-d H:i:s'],
            'ends_at'          => ['sometimes','date_format:Y-m-d H:i:s','after:starts_at'],
            'status'           => ['sometimes', Rule::in(['pending','confirmed','completed','cancelled'])],
            'price'            => ['sometimes','numeric','min:0'],
        ]);

        $tz = config('app.timezone');
        $expertId = $data['beauty_expert_id'] ?? $booking->beauty_expert_id;

        $currentStart = Carbon::parse($booking->starts_at)->setTimezone($tz)->second(0);
        $currentEnd   = Carbon::parse($booking->ends_at)->setTimezone($tz)->second(0);

        $starts = isset($data['starts_at'])
            ? Carbon::createFromFormat('Y-m-d H:i:s', $data['starts_at'], $tz)->second(0)
            : $currentStart;
        $ends   = isset($data['ends_at'])
            ? Carbon::createFromFormat('Y-m-d H:i:s', $data['ends_at'], $tz)->second(0)
            : $currentEnd;

        if (
            $expertId != $booking->beauty_expert_id ||
            !$starts->equalTo($currentStart) ||
            !$ends->equalTo($currentEnd)
        ) {
            $date  = $starts->toDateString();
            $open  = Carbon::createFromFormat('Y-m-d H:i:s', "$date 09:00:00", $tz);
            $close = Carbon::createFromFormat('Y-m-d H:i:s', "$date 19:00:00", $tz);

            if ($starts->lt($open) || $ends->gt($close) || $starts->diffInMinutes($ends) !== 30
                || !$this->isAlignedTo30($starts) || !$this->isAlignedTo30($ends)) {
                return response()->json([
                    'message' => 'Slot must be exactly 30 minutes, aligned to :00 or :30, within 09:00–19:00.'
                ], 422);
            }

            $existing = Booking::where('beauty_expert_id', $expertId)
                ->where('id', '<>', $booking->id)
                ->where('starts_at', $starts->format('Y-m-d H:i:s'))
                ->whereIn('status', ['pending','confirmed'])
                ->count();

            if ($existing >= 3) {
                return response()->json(['message' => 'This time is full. Choose another slot.'], 409);
            }
        }

        $update = $data;
        if (isset($data['starts_at'])) $update['starts_at'] = $starts;
        if (isset($data['ends_at']))   $update['ends_at']   = $ends;

        $booking->update($update);

        return response()->json($booking->fresh()->load(['user','beautyExpert']));
    }

    /* ------------------------- DESTROY ----------------------- */
    public function destroy(Booking $booking)
    {
        $booking->delete();
        return response()->noContent();
    }
}
