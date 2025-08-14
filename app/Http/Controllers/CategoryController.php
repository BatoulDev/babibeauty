<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    // GET /api/categories?search=&page=
    public function index(Request $request)
    {
        $q = Category::query();

        if ($s = $request->query('search')) {
            $q->where('name', 'like', "%{$s}%");
        }

        return $q->orderBy('name')->paginate(10);
    }

    // GET /api/categories/{category}
    public function show(Category $category)
    {
        return $category;
    }

    // POST /api/categories
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255','unique:categories,name'],
        ]);

        $category = Category::create($data);

        return response()->json($category, 201);
    }

    // PUT /api/categories/{category}
    public function update(Request $request, Category $category)
    {
        $data = $request->validate([
            'name' => [
                'required','string','max:255',
                Rule::unique('categories','name')->ignore($category->id),
            ],
        ]);

        $category->update($data);

        return response()->json($category);
    }

    // DELETE /api/categories/{category}
    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
