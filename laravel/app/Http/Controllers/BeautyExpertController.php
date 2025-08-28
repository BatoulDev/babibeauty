<?php

namespace App\Http\Controllers;

use App\Models\BeautyExpert;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class BeautyExpertController extends Controller
{
    /**
     * GET /beauty-experts
     * Filters: ?q=maya&specialty=Makeup&is_active=1
     * Pagination: ?page=1&per_page=10
     * Sort: ?sort=name&dir=asc
     */
    public function index(Request $request)
    {
        $q    = trim((string) $request->query('q', ''));
        $spec = trim((string) $request->query('specialty', ''));
        $per  = max(6, min((int) $request->query('per_page', 12), 48));

        $experts = BeautyExpert::query()
            ->select('id','name','specialty','bio','phone','is_active','avatar_path','base_price') // 👈 add these
            ->where('is_active', 1)
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('name', 'like', "%{$q}%")
                      ->orWhere('specialty', 'like', "%{$q}%");
                });
            })
            ->when($spec !== '', function ($qq) use ($spec) {
                $qq->where('specialty', 'like', "%{$spec}%");
            })
            ->orderBy('name')
            ->paginate($per);

        return response()->json($experts);
    }

    /**
     * POST /beauty-experts
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'       => ['required','string','max:255'],
            'specialty'  => ['nullable','string','max:100'],
            'bio'        => ['nullable','string'],
            'phone'      => ['nullable','string','max:30'],
            'is_active'  => ['nullable','boolean'],
            'avatar_path'=> ['nullable','string','max:255'], // optional
            'base_price' => ['nullable','numeric','min:0'],  // optional
        ]);

        $expert = BeautyExpert::create($data);
        return response()->json($expert, Response::HTTP_CREATED);
    }

    /**
     * GET /beauty-experts/{beauty_expert}
     */
    public function show(BeautyExpert $beautyExpert)
    {
        return response()->json(
            $beautyExpert->only([
                'id','name','specialty','bio','phone','is_active','avatar_path','base_price' // 👈 add these
            ])
        );
    }

    /**
     * PUT/PATCH /beauty-experts/{beauty_expert}
     */
    public function update(Request $request, BeautyExpert $beauty_expert)
    {
        $data = $request->validate([
            'name'       => ['sometimes','string','max:255'],
            'specialty'  => ['sometimes','nullable','string','max:100'],
            'bio'        => ['sometimes','nullable','string'],
            'phone'      => ['sometimes','nullable','string','max:30'],
            'is_active'  => ['sometimes','boolean'],
            'avatar_path'=> ['sometimes','nullable','string','max:255'],
            'base_price' => ['sometimes','nullable','numeric','min:0'],
        ]);

        $beauty_expert->update($data);
        return response()->json($beauty_expert->only([
            'id','name','specialty','bio','phone','is_active','avatar_path','base_price'
        ]));
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
