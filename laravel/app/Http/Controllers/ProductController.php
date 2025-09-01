<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class ProductController extends Controller
{
  public function index(Request $request)
{
    $q = Product::query()
        ->select('id','name','price','image_path','category_id','brand_id','stock','is_active')
        ->where('is_active', 1)
        ->when($request->filled('category_id'),
            fn ($qq) => $qq->where('category_id', (int) $request->category_id))
        ->when($request->filled('brand_id'),
            fn ($qq) => $qq->where('brand_id', (int) $request->brand_id))
        ->orderBy('name')
        ->withAvg('reviews', 'rating')
        ->withCount('reviews');

    // ✅ paginate instead of get()
    $perPage = (int) $request->input('per_page', 24);
    $products = $q->paginate($perPage);

    // ✅ transform each item
    $mapped = $products->getCollection()->map(function ($p) {
        return [
            'id'            => $p->id,
            'name'          => $p->name,
            'price'         => (float) $p->price,
            'image_url'     => $this->publicImageUrl($p->image_path),
            'rating'        => is_numeric($p->reviews_avg_rating ?? null)
                                ? round($p->reviews_avg_rating, 1) : null,
            'reviews_count' => (int) ($p->reviews_count ?? 0),
        ];
    });

    // ✅ replace the paginator's collection with transformed items
    $products->setCollection($mapped);

    return response()->json($products);
}


    /**
     * FAST, cacheable details endpoint (small payload for first paint).
     * GET /api/products/{id}
     */
    public function showFast(Request $req, int $id)
    {
        // Cache the serialized product view for 10 minutes
        $cacheKey = "product:fast:$id:v1";
        $payload = Cache::remember($cacheKey, 600, function() use ($id) {
            $p = Product::with(['brand:id,name', 'category:id,name'])
                ->withAvg('reviews', 'rating')
                ->withCount('reviews')
                ->select(['id','name','price','image_path','brand_id','category_id','updated_at'])
                ->findOrFail($id);

            $imageUrl = $this->publicImageUrl($p->image_path);
            $srcset   = $imageUrl ? ($imageUrl . ' 800w') : null;

            return [
                'id'            => $p->id,
                'name'          => $p->name,
                'price'         => (float) $p->price,
                'image_url'     => $imageUrl,
                'image_srcset'  => $srcset,
                'brand'         => optional($p->brand)->name,
                'category'      => optional($p->category)->name,
                'rating'        => is_numeric($p->reviews_avg_rating ?? null)
                                    ? round((float)$p->reviews_avg_rating, 1) : 0.0,
                'reviews_count' => (int) ($p->reviews_count ?? 0),
                'description'   => $p->short_description ?? null, // keep light if present
                'updated_at'    => $p->updated_at?->toRfc7231String(),
            ];
        });

        // Strong ETag based on payload hash
        $etag = '"' . sha1(json_encode($payload)) . '"';
        if (trim((string)$req->header('If-None-Match')) === $etag) {
            return response('', 304)
                ->header('ETag', $etag)
                ->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
        }

        return response()->json($payload)
            ->header('ETag', $etag)
            ->header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    }

    /**
     * FULL details (legacy/show) – keep for admin/internal or if you still need it.
     * Consider pointing your frontend to showFast + lazy /reviews for best speed.
     */
    public function show(Product $product)
    {
        $product->loadMissing([
            'brand:id,name',
            'category:id,name',
            'reviews' => fn ($q) => $q->latest()->with('user:id,name'),
        ])->loadAvg('reviews', 'rating')
          ->loadCount('reviews');

        $imageUrl = $product->image_path ? url(Storage::url($product->image_path)) : null;
        $srcset   = $imageUrl ? ($imageUrl.' 800w') : null;

        return response()->json([
            'id'             => $product->id,
            'name'           => $product->name,
            'description'    => $product->description,
            'price'          => (float) $product->price,
            'stock'          => (int) $product->stock,
            'image_url'      => $imageUrl,
            'image_srcset'   => $srcset,
            'brand'          => $product->brand?->name,
            'category'       => $product->category?->name,
            'rating'         => round((float) ($product->reviews_avg_rating ?? 0), 1),
            'reviews_count'  => (int) ($product->reviews_count ?? 0),
            'reviews'        => $product->reviews->map(fn ($r) => [
                'id'         => $r->id,
                'user'       => $r->user->name ?? 'Guest',
                'rating'     => (int) $r->rating,
                'comment'    => $r->comment,
                'created_at' => $r->created_at?->toDateTimeString(),
            ]),
        ]);
    }

    /**
     * Lightweight reviews endpoint to lazy-load on the client.
     * GET /api/products/{id}/reviews
     */
    public function reviewsFast(int $id)
    {
        $cacheKey = "product:reviews:$id:v1";
        $reviews = Cache::remember($cacheKey, 600, function() use ($id) {
            return \App\Models\Review::where('reviewable_type', Product::class)
                ->where('reviewable_id', $id)
                ->latest('id')
                ->limit(50)
                ->with('user:id,name')
                ->get(['id','user_id','rating','comment','created_at'])
                ->map(fn($r) => [
                    'id'         => $r->id,
                    'user'       => optional($r->user)->name ?? 'User',
                    'rating'     => (int)$r->rating,
                    'comment'    => $r->comment,
                    'created_at' => $r->created_at?->toDateTimeString(),
                ]);
        });

        return response()->json($reviews)
            ->header('Cache-Control', 'public, max-age=120, stale-while-revalidate=60');
    }

    /** POST /products */
    public function store(Request $request)
    {
        $data = $request->validate([
            'brand_id'    => ['required','exists:brands,id'],
            'category_id' => ['required','exists:categories,id'],
            'name'        => ['required','string','max:255'],
            'description' => ['nullable','string'],
            'price'       => ['required','numeric','min:0'],
            'stock'       => ['nullable','integer','min:0'],
            'is_active'   => ['nullable','boolean'],
        ]);

        $product = Product::create($data)->load(['brand:id,name','category:id,name']);
        $product->image_url = $this->publicImageUrl($product->image_path);

        return response()->json($product, Response::HTTP_CREATED);
    }

    /** PUT/PATCH /products/{product} */
    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'brand_id'    => ['sometimes','exists:brands,id'],
            'category_id' => ['sometimes','exists:categories,id'],
            'name'        => ['sometimes','string','max:255'],
            'description' => ['nullable','string'],
            'price'       => ['sometimes','numeric','min:0'],
            'stock'       => ['sometimes','integer','min:0'],
            'is_active'   => ['sometimes','boolean'],
        ]);

        $product->update($data);
        $product->load(['brand:id,name','category:id,name']);
        $product->image_url = $this->publicImageUrl($product->image_path);

        return response()->json($product);
    }

    /** DELETE /products/{product} */
    public function destroy(Product $product)
    {
        $product->delete();
        return response()->noContent();
    }

    /* ------------------------------------------------------------------ */
    /* helpers                                                            */
    /* ------------------------------------------------------------------ */

    protected function publicImageUrl(?string $path): string
    {
        if (!$path || trim($path) === '') return $this->placeholderDataUri();
        if (preg_match('#^https?://#i', $path)) return $path;

        $p = ltrim(str_replace('\\','/',$path), '/');
        foreach (['storage/app/public/','app/public/','public/','storage/'] as $prefix) {
            if (stripos($p, $prefix) === 0) { $p = substr($p, strlen($prefix)); break; }
        }
        $segments = array_map(fn($seg) =>
            preg_match('/%[0-9A-Fa-f]{2}/', $seg) ? $seg : rawurlencode($seg),
            array_filter(explode('/', $p), fn($s) => $s !== '')
        );
        $base = rtrim(config('app.url') ?: url('/'), '/');
        return $base . '/storage/' . implode('/', $segments);
    }

    protected function placeholderDataUri(): string
    {
        $svg = "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='#561C24'/><stop offset='1' stop-color='#6D2932'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='#EEE3D1' font-family='Georgia, serif' font-size='160'>G</text></svg>";
        return 'data:image/svg+xml;charset=UTF-8,' . rawurlencode($svg);
    }
}
