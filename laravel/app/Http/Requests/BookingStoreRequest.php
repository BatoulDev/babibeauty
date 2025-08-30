<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BookingStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'beauty_expert_id' => ['bail','required','integer','exists:beauty_experts,id'],
            'starts_at'        => ['bail','required','date_format:Y-m-d H:i:s'],
            // ends_at is optional; if provided we ignore it anyway
            'ends_at'          => ['sometimes','nullable','date_format:Y-m-d H:i:s'],
            'price'            => ['nullable','numeric','min:0'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            if ($v->errors()->any()) return;

            $tz = config('app.timezone');

            try {
                $s = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', (string)$this->starts_at, $tz)->second(0);
            } catch (\Throwable $ex) {
                $v->errors()->add('starts_at', 'Invalid start date/time.');
                return;
            }

            // Enforce grid alignment :00 or :30
            $min = (int) $s->format('i');
            if (!in_array($min, [0,30], true)) {
                $v->errors()->add('starts_at', 'Start must be at :00 or :30.');
            }

            // Working hours 09:00–19:00 (latest usable start = 18:30)
            $date  = $s->toDateString();
            $open  = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', "$date 09:00:00", $tz);
            $close = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', "$date 19:00:00", $tz);
            $end   = $s->copy()->addMinutes(30)->second(0);
            if ($s->lt($open) || $end->gt($close)) {
                $v->errors()->add('starts_at', 'Outside working hours (09:00–19:00).');
            }

            // Capacity: max 3 bookings at the same starts_at (exclude cancelled)
            if (!$v->errors()->any()) {
                $capacity = 3;
                $countAtStart = \App\Models\Booking::where('beauty_expert_id', (int)$this->beauty_expert_id)
                    ->where('starts_at', $s->format('Y-m-d H:i:s'))
                    ->whereIn('status', ['pending','confirmed'])
                    ->count();

                if ($countAtStart >= $capacity) {
                    $v->errors()->add('starts_at', 'This time is full. Choose another slot.');
                }
            }
        });
    }

    public function attributes(): array
    {
        return [
            'beauty_expert_id' => 'beauty expert',
            'starts_at'        => 'start time',
            'ends_at'          => 'end time',
        ];
    }
}
