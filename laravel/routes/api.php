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
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;

// Optional numeric constraints
Route::pattern('category', '[0-9]+');
Route::pattern('product',  '[0-9]+');
Route::pattern('brand',    '[0-9]+');
Route::pattern('beauty_expert', '[0-9]+');
Route::pattern('booking', '[0-9]+');
Route::pattern('order', '[0-9]+');


// ── Auth (public)
Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('register');
    Route::post('/login',    [AuthController::class, 'login'])->name('login');

    // ── Auth (requires Bearer token)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',          [AuthController::class, 'me'])->name('me');
        Route::post('/logout',     [AuthController::class, 'logout'])->name('logout');
        Route::post('/logout-all', [AuthController::class, 'logoutAll'])->name('logout-all');
    });
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



Route::prefix('bookings')->group(function () {
    // public
    Route::get('/',                [BookingController::class, 'index']);
    Route::get('/availability',    [BookingController::class, 'availability']);
    Route::get('/{booking}',       [BookingController::class, 'show']);

    // write ops (auth)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/',                   [BookingController::class, 'store']);
        Route::match(['put','patch'],'/{booking}', [BookingController::class, 'update']);
        Route::delete('/{booking}',        [BookingController::class, 'destroy']);
    });
});


//reviews
Route::apiResource('reviews', ReviewController::class)->only(['index','show']);
Route::apiResource('reviews', ReviewController::class)->only(['store','update','destroy']);

//order
Route::apiResource('orders', OrderController::class)->only(['index','show']);
Route::apiResource('orders', OrderController::class)->only(['store','update','destroy']);

//Contact
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/cart', [CartController::class, 'index']);          // list
    Route::post('/cart', [CartController::class, 'store']);          // add/increment
    Route::patch('/cart/{cart}', [CartController::class, 'update']); // change qty
    Route::delete('/cart/{cart}', [CartController::class, 'destroy']);// remove one
    Route::delete('/cart', [CartController::class, 'clear']);        // clear all
    Route::post('/checkout', [CheckoutController::class, 'create']);
});

  