<?php

namespace App\Http\Controllers;

use App\Models\BeautyExpert;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class BeautyExpertController extends Controller
{
    /**
     * GET /beauty-experts
     * Filters: ?search=maya&specialty=Makeup&is_active=1
     * Pagination: ?page=1&per_page=10
     * Sort: ?sort=name&dir=asc
     */
    public function index(Request $request)
    {
        $q = BeautyExpert::query();

        if ($s = $request->query('search')) {
            $q->where(function($qq) use ($s) {
                $qq->where('name', 'like', "%{$s}%")
                   ->orWhere('bio', 'like', "%{$s}%")
                   ->orWhere('specialty', 'like', "%{$s}%");
            });
        }

        if ($spec = $request->query('specialty')) $q->where('specialty', 'like', "%{$spec}%");
        if (!is_null($request->query('is_active'))) $q->where('is_active', (bool)$request->query('is_active'));

        $sort = in_array($request->query('sort'), ['name','specialty','created_at']) ? $request->query('sort') : 'created_at';
        $dir  = $request->query('dir') === 'asc' ? 'asc' : 'desc';
        $q->orderBy($sort, $dir);

        $perPage = (int) $request->query('per_page', 10);
        return response()->json($q->paginate($perPage));
    }

    /**
     * POST /beauty-experts
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'      => ['required','string','max:255'],
            'specialty' => ['nullable','string','max:100'],
            'bio'       => ['nullable','string'],
            'phone'     => ['nullable','string','max:30'],
            'is_active' => ['nullable','boolean'],
        ]);

        $expert = BeautyExpert::create($data);
        return response()->json($expert, Response::HTTP_CREATED);
    }

    /**
     * GET /beauty-experts/{beauty_expert}
     */
    public function show(BeautyExpert $beauty_expert)
    {
        return response()->json($beauty_expert);
    }

    /**
     * PUT/PATCH /beauty-experts/{beauty_expert}
     */
    public function update(Request $request, BeautyExpert $beauty_expert)
    {
        $data = $request->validate([
            'name'      => ['sometimes','string','max:255'],
            'specialty' => ['sometimes','nullable','string','max:100'],
            'bio'       => ['sometimes','nullable','string'],
            'phone'     => ['sometimes','nullable','string','max:30'],
            'is_active' => ['sometimes','boolean'],
        ]);

        $beauty_expert->update($data);
        return response()->json($beauty_expert);
    }

    /**
     * DELETE /beauty-experts/{beauty_expert}
     */
    public function destroy(BeautyExpert $beauty_expert)
    {
        $beauty_expert->delete();
        return response()->json(['message' => 'Deleted'], Response::HTTP_NO_CONTENT);
    }
}
