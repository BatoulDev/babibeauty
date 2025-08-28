<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Validator;

class BookingStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; } // adjust to auth if needed

    public function rules(): array
    {
        return [
            'beauty_expert_id' => ['required','exists:beauty_experts,id'],
            'starts_at'        => ['required','date_format:Y-m-d H:i'], // we’ll derive ends_at
            'price'            => ['nullable','numeric','min:0'],
        ];
    }

    public function withValidator(Validator $v): void
    {
        $v->after(function($v){
            $start = Carbon::createFromFormat('Y-m-d H:i', $this->input('starts_at'))->seconds(0);

            // enforce 30-min grid (minutes 00 or 30)
            if (!in_array((int)$start->minute, [0,30])) {
                $v->errors()->add('starts_at', 'Start time must be on a 30-minute slot.');
                return;
            }

            // business hours [09:00, 19:00] (end is exclusive)
            $open  = (clone $start)->setTime(9,0);
            $close = (clone $start)->setTime(19,0);

            $end = (clone $start)->addMinutes(30);
            if ($start->lt($open) || $end->gt($close)) {
                $v->errors()->add('starts_at', 'Bookings allowed 09:00–19:00 (30 min).');
            }
        });
    }

    public function passedValidation(): void
    {
        // Make ends_at available to controller
        $start = \Illuminate\Support\Carbon::createFromFormat('Y-m-d H:i', $this->input('starts_at'))->seconds(0);
        $this->merge(['ends_at' => $start->copy()->addMinutes(30)->format('Y-m-d H:i:s')]);
        $this->merge(['starts_at' => $start->format('Y-m-d H:i:s')]);
    }
}

