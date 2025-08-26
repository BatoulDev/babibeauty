<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\MediaController;

Route::get('/', function () {
    return view('welcome');
});
Route::get('/media/thumb/{wh}/{path}', [MediaController::class, 'thumb'])
    ->where(['wh' => '[0-9]+x[0-9]+', 'path' => '.*']);