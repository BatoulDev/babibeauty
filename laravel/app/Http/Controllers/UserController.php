<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // Return a list of users (id, name, email)
    public function index()
    {
        return User::select('id', 'name', 'email')->get();
    }
}