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

Route::apiResource('categories', CategoryController::class)->only(['index','show','store','update','destroy']);

// ── Brands
Route::apiResource('brands', BrandController::class)->only(['index','show']);
Route::apiResource('brands', BrandController::class)->only(['store','update','destroy']);

//products
Route::apiResource('products', ProductController::class)
    ->only(['index','show','store','update','destroy']);


// routes/api.php
Route::get('/beauty-experts', [BeautyExpertController::class, 'index']); // you already have

// routes/api.php
Route::get('/beauty-experts/{id}/reviews', function($id){
    return \App\Models\Review::where('reviewable_type','App\\Models\\BeautyExpert')
        ->where('reviewable_id', (int)$id)
        ->latest()
        ->select('id','rating','comment','created_at')   // keep payload light
        ->limit(5)
        ->get();
});


// routes/api.php
Route::get('/bookings', [BookingController::class, 'index']);
Route::get('/bookings/availability', [BookingController::class, 'availability']); // NEW
Route::post('/bookings', [BookingController::class, 'store']);
Route::get('/bookings/{booking}', [BookingController::class, 'show']);
Route::match(['put','patch'],'/bookings/{booking}', [BookingController::class, 'update']);
Route::delete('/bookings/{booking}', [BookingController::class, 'destroy']);



//reviews
Route::apiResource('reviews', ReviewController::class)->only(['index','show']);
Route::apiResource('reviews', ReviewController::class)->only(['store','update','destroy']);

//order
Route::apiResource('orders', OrderController::class)->only(['index','show']);
Route::apiResource('orders', OrderController::class)->only(['store','update','destroy']);

//Contact
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:10,1');