<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * POST /api/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        // Name the token after the client/device for easier debugging
        $deviceName = $request->input('device_name') ?: ($request->userAgent() ?: 'api');
        $token = $user->createToken($deviceName, ['*'])->plainTextToken;

        return response()->json([
            'message'    => 'Registration successful',
            'user'       => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'is_admin' => (bool) ($user->is_admin ?? false),
            ],
            'token'      => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    /**
     * POST /api/login
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'       => ['required','email'],
            'password'    => ['required','string','min:8'],
            'device_name' => ['nullable','string','max:255'],
        ]);

        if (! Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']])) {
            return response()->json(['message' => 'Invalid login details'], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $deviceName = $credentials['device_name'] ?? ($request->userAgent() ?: 'api');
        $token = $user->createToken($deviceName, ['*'])->plainTextToken;

        return response()->json([
            'message'    => 'Login successful',
            'user'       => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'is_admin' => (bool) ($user->is_admin ?? false),
            ],
            'token'      => $token,
            'token_type' => 'Bearer',
        ], 200);
    }

    /**
     * GET /api/me   (auth:sanctum)
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id'       => $user->id,
            'name'     => $user->name,
            'email'    => $user->email,
            'is_admin' => (bool) ($user->is_admin ?? false),
        ]);
    }

    /**
     * POST /api/logout   (auth:sanctum)
     * Revokes the current access token only.
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()?->currentAccessToken();
        if ($token) {
            $token->delete();
        }

        return response()->json(['message' => 'Logged out'], 200);
    }

    /**
     * POST /api/logout-all   (auth:sanctum)
     * Revokes ALL tokens for the user.
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out from all devices'], 200);
    }
}
