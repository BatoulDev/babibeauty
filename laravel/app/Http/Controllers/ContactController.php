<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Contact;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'    => ['required','string','max:120'],
            'email'   => ['required','email','max:255'],
            'message' => ['required','string','max:5000'],
        ]);

        $contact = Contact::create($data);

        return response()->json([
            'status'  => 'success',
            'message' => 'Thanks! Your message was received.',
            'contact' => $contact   // returns name, email, message, id, timestamps
        ], 201);
    }
}
