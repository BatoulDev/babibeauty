<?php
// database/migrations/2025_08_28_000001_add_avatar_to_beauty_experts.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('beauty_experts', function (Blueprint $t) {
            $t->string('avatar_path')->nullable()->after('bio'); // e.g. "experts/lara.jpg"
            $t->decimal('base_price', 8, 2)->default(0)->after('avatar_path'); // optional, used in UI
        });
    }
    public function down(): void {
        Schema::table('beauty_experts', function (Blueprint $t) {
            $t->dropColumn(['avatar_path','base_price']);
        });
    }
};
