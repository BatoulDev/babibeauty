<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Product;
use App\Models\BeautyExpert;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    // Map friendly types to model classes
    private const TYPE_MAP = [
        'product'        => Product::class,
        'products'       => Product::class,
        'beauty-expert'  => BeautyExpert::class,
        'beauty_expert'  => BeautyExpert::class,
        'beauty-experts' => BeautyExpert::class,
    ];

    /**
     * GET /reviews
     * Filters:
     *  - ?for=product&for_id=1   OR   ?reviewable_type=product&reviewable_id=1
     *  - ?user_id=1
     *  - ?min=3&max=5
     * Sorting: ?sort=created_at|rating & ?dir=asc|desc
     * Pagination: ?page=1&per_page=10
     */
    public function index(Request $request)
    {
        $q = Review::with(['user','reviewable']);

        // Filter by target
        [$class, $rid] = $this->extractTarget($request);
        if ($class && $rid) {
            $q->where('reviewable_type', $class)->where('reviewable_id', $rid);
        }

        if ($uid = $request->query('user_id')) $q->where('user_id', $uid);
        if ($min = $request->query('min'))     $q->where('rating', '>=', (int)$min);
        if ($max = $request->query('max'))     $q->where('rating', '<=', (int)$max);

        $sort = in_array($request->query('sort'), ['created_at','rating']) ? $request->query('sort') : 'created_at';
        $dir  = $request->query('dir') === 'asc' ? 'asc' : 'desc';
        $q->orderBy($sort, $dir);

        $perPage = (int) $request->query('per_page', 10);
        return response()->json($q->paginate($perPage));
    }

    /**
     * POST /reviews
     * Body can be either:
     *  { "user_id":1, "for":"product", "for_id":1, "rating":5, "comment":"..." }
     *  or raw morph:
     *  { "user_id":1, "reviewable_type":"product", "reviewable_id":1, "rating":5 }
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'         => ['required','exists:users,id'],
            'rating'          => ['required','integer','min:1','max:5'],
            'comment'         => ['nullable','string'],
            'for'             => ['nullable', Rule::in(array_keys(self::TYPE_MAP))],
            'for_id'          => ['nullable','integer'],
            'reviewable_type' => ['nullable','string'],
            'reviewable_id'   => ['nullable','integer'],
        ]);

        // Resolve target (prefer friendly keys)
        [$class, $rid] = $this->extractTarget($request, required: true);

        // Ensure target actually exists
        if (! $this->targetExists($class, $rid)) {
            return response()->json(['message' => 'Target not found.'], 422);
        }

        // Optional uniqueness: 1 review per user per target
        $exists = Review::where('user_id', $data['user_id'])
            ->where('reviewable_type', $class)
            ->where('reviewable_id', $rid)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'You have already reviewed this item.'], 422);
        }

        $review = Review::create([
            'user_id'         => $data['user_id'],
            'rating'          => $data['rating'],
            'comment'         => $data['comment'] ?? null,
            'reviewable_type' => $class,
            'reviewable_id'   => $rid,
        ])->load(['user','reviewable']);

        return response()->json($review, Response::HTTP_CREATED);
    }

    /**
     * GET /reviews/{review}
     */
    public function show(Review $review)
    {
        return response()->json($review->load(['user','reviewable']));
    }

    /**
     * PUT/PATCH /reviews/{review}
     * Only allow changing rating/comment (not target/user).
     */
    public function update(Request $request, Review $review)
    {
        $data = $request->validate([
            'rating'  => ['sometimes','integer','min:1','max:5'],
            'comment' => ['sometimes','nullable','string'],
        ]);

        $review->update($data);
        return response()->json($review->fresh()->load(['user','reviewable']));
    }

    /**
     * DELETE /reviews/{review}
     */
    public function destroy(Review $review)
    {
        $review->delete();
        return response()->json(['message' => 'Deleted'], Response::HTTP_NO_CONTENT);
    }

    /**
     * GET /reviews/summary?for=product&for_id=1
     * Returns avg & count for a target.
     */
    public function summary(Request $request)
    {
        [$class, $rid] = $this->extractTarget($request, required: true);

        $stats = Review::where('reviewable_type', $class)
            ->where('reviewable_id', $rid)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as count')
            ->first();

        return response()->json([
            'reviewable_type' => $class,
            'reviewable_id'   => $rid,
            'avg_rating'      => round((float)($stats->avg_rating ?? 0), 2),
            'count'           => (int)($stats->count ?? 0),
        ]);
    }

    // ---------- helpers ----------

    private function extractTarget(Request $request, bool $required = false): array
    {
        if ($request->filled('for') && $request->filled('for_id')) {
            $for = $request->input('for');
            $class = self::TYPE_MAP[$for] ?? null;
            $rid   = (int) $request->input('for_id');
        } else {
            $rawType = $request->input('reviewable_type');
            $rid     = (int) $request->input('reviewable_id');
            $key     = is_string($rawType) ? strtolower($rawType) : null;
            $class   = $key && isset(self::TYPE_MAP[$key]) ? self::TYPE_MAP[$key] : null;
        }

        if ($required && (! $class || ! $rid)) {
            abort(response()->json(['message' => 'Provide target via (for, for_id) or (reviewable_type, reviewable_id).'], 422));
        }

        return [$class, $rid ?: null];
    }

    private function targetExists(string $class, int $id): bool
    {
        return (bool) $class::query()->whereKey($id)->exists();
    }
}
