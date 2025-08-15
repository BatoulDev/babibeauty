<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class BrandController extends Controller
{
    // GET /brands
    public function index()
    {
        return response()->json(Brand::withCount('products')->get());
    }

    // POST /brands
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name'
        ]);

        $brand = Brand::create($data);
        return response()->json($brand, Response::HTTP_CREATED);
    }

    // GET /brands/{brand}
    public function show(Brand $brand)
    {
        return response()->json($brand->load('products'));
    }

    // PUT/PATCH /brands/{brand}
    public function update(Request $request, Brand $brand)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255|unique:brands,name,' . $brand->id
        ]);

        $brand->update($data);
        return response()->json($brand);
    }

    // DELETE /brands/{brand}
    public function destroy(Brand $brand)
    {
        $brand->delete();
        return response()->json(['message' => 'Brand deleted'], Response::HTTP_NO_CONTENT);
    }
}
