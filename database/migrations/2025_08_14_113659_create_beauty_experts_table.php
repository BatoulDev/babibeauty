<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('beauty_experts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('specialty', 100)->nullable();
            $table->text('bio')->nullable();
            $table->string('phone', 30)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('beauty_experts');
    }
};
