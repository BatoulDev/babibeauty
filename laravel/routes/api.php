<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\BeautyExpertController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ContactController;

// Optional numeric constraints
Route::pattern('category', '[0-9]+');
Route::pattern('product',  '[0-9]+');
Route::pattern('brand',    '[0-9]+');
Route::pattern('beauty_expert', '[0-9]+');
Route::pattern('booking', '[0-9]+');
Route::pattern('order', '[0-9]+');

// ── Auth
Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login',    [AuthController::class, 'login'])->name('login');
    Route::get('/me',        [AuthController::class, 'me'])->name('me');
    Route::post('/logout',   [AuthController::class, 'logout'])->name('logout');
    Route::post('/logout-all', [AuthController::class, 'logoutAll'])->name('logout-all');
});


// ── Categories
Route::apiResource('categories', CategoryController::class)->only(['index','show']);
Route::apiResource('categories', CategoryController::class)->only(['store','update','destroy']);

// ── Brands
Route::apiResource('brands', BrandController::class)->only(['index','show']);
Route::apiResource('brands', BrandController::class)->only(['store','update','destroy']);

// ── Products
Route::apiResource('products', ProductController::class)->only(['index','show']);
Route::apiResource('products', ProductController::class)->only(['store','update','destroy']);

// ── Beauty Experts
Route::apiResource('beauty-experts', BeautyExpertController::class)->only(['index','show']);
Route::apiResource('beauty-experts', BeautyExpertController::class)->only(['store','update','destroy']);

//booking
Route::apiResource('bookings', BookingController::class)->only(['index','show']);
Route::apiResource('bookings', BookingController::class)->only(['store','update','destroy']);

//reviews
Route::apiResource('reviews', ReviewController::class)->only(['index','show']);
Route::apiResource('reviews', ReviewController::class)->only(['store','update','destroy']);

//order
Route::apiResource('orders', OrderController::class)->only(['index','show']);
Route::apiResource('orders', OrderController::class)->only(['store','update','destroy']);

//Contact
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:10,1');