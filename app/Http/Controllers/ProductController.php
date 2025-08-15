<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ProductController extends Controller
{
    /**
     * GET /products
     * Optional filters: ?search=iphone&brand_id=1&category_id=2&is_active=1
     * Optional sort: ?sort=price&dir=asc
     * Pagination: ?page=1&per_page=10
     */
    public function index(Request $request)
    {
        $query = Product::with(['brand','category']);

        if ($s = $request->query('search')) {
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }
        if ($brand = $request->query('brand_id'))    $query->where('brand_id', $brand);
        if ($cat   = $request->query('category_id')) $query->where('category_id', $cat);
        if (!is_null($request->query('is_active')))  $query->where('is_active', (bool)$request->query('is_active'));

        $sort = in_array($request->query('sort'), ['name','price','stock','created_at']) ? $request->query('sort') : 'created_at';
        $dir  = $request->query('dir') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sort, $dir);

        $perPage = (int)($request->query('per_page', 10));
        return response()->json($query->paginate($perPage));
    }

    /**
     * POST /products
     */
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

        $product = Product::create($data)->load(['brand','category']);

        return response()->json($product, Response::HTTP_CREATED);
    }

    /**
     * GET /products/{product}
     */
    public function show(Product $product)
    {
        return response()->json($product->load(['brand','category']));
    }

    /**
     * PUT/PATCH /products/{product}
     */
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

        return response()->json($product->load(['brand','category']));
    }

    /**
     * DELETE /products/{product}
     */
    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Deleted'], Response::HTTP_NO_CONTENT);
    }
}
