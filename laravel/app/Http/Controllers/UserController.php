<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // GET /api/users
    public function index(Request $request)
    {
        $q = $request->query('q');

        $users = User::query()
            ->when($q, fn($query) =>
                $query->where(function ($qq) use ($q) {
                    $qq->where('name', 'like', "%$q%")
                       ->orWhere('email', 'like', "%$q%");
                })
            )
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 10));

        return response()->json($users);
    }

    // GET /api/users/{id}
    public function show(User $user)
    {
        return response()->json($user);
    }

    // POST /api/users
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'     => ['required','string','max:255'],
            'email'    => ['required','email','max:255','unique:users,email'],
            'password' => ['required','string','min:8'],
            'is_admin' => ['sometimes','boolean'],
        ]);

        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);

        return response()->json($user, 201);
    }

    // PUT/PATCH /api/users/{id}
    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'     => ['sometimes','string','max:255'],
            'email'    => ['sometimes','email','max:255', Rule::unique('users','email')->ignore($user->id)],
            'password' => ['nullable','string','min:8'],
            'is_admin' => ['sometimes','boolean'],
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json($user);
    }

    // DELETE /api/users/{id}
    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'deleted']);
    }

    // PATCH /api/users/{id}/toggle-admin
    public function toggleAdmin(User $user)
    {
        $user->is_admin = ! $user->is_admin;
        $user->save();

        return response()->json([
            'id' => $user->id,
            'is_admin' => $user->is_admin,
        ]);
    }

    // PATCH /api/users/{id}/password
    public function updatePassword(Request $request, User $user)
    {
        $validated = $request->validate([
            'password' => ['required','string','min:8','confirmed'],
        ]);

        $user->password = Hash::make($validated['password']);
        $user->save();

        return response()->json(['message' => 'password updated']);
    }
}
