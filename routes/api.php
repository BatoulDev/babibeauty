<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;

// Constrain numeric IDs globally
Route::pattern('category', '[0-9]+');

// ── Auth endpoints (rate-limited, grouped under /auth)
Route::prefix('auth')->name('auth.')->middleware('throttle:20,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login',    [AuthController::class, 'login'])->name('login');

    // Optional utilities (work only if you later enable session/token auth)
    Route::get('/me',          [AuthController::class, 'me'])->name('me');
    Route::post('/logout',     [AuthController::class, 'logout'])->name('logout');
    Route::post('/logout-all', [AuthController::class, 'logoutAll'])->name('logout-all');
});

// ── Categories
// Public reads
Route::apiResource('categories', CategoryController::class)->only(['index','show']);

// Writes (you can keep them public or add simple throttling)
Route::middleware('throttle:60,1')->group(function () {
    Route::apiResource('categories', CategoryController::class)->only(['store','update','destroy']);
});
