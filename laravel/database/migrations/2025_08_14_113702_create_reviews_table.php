<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating'); // 1..5 (validate in app)
            $table->text('comment')->nullable();
            $table->morphs('reviewable'); // creates reviewable_type & reviewable_id (indexed)
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('reviews');
    }
};
