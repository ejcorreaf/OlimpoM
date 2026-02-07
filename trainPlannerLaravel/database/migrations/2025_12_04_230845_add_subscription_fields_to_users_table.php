<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'estado_suscripcion')) {
                $table->enum('estado_suscripcion', ['activa', 'expirada', 'ninguna', 'pendiente'])->default('ninguna')->after('notes');
            }

            if (!Schema::hasColumn('users', 'suscripcion_expira_en')) {
                $table->timestamp('suscripcion_expira_en')->nullable()->after('estado_suscripcion');
            }

            if (!Schema::hasColumn('users', 'plan_id')) {
                $table->foreignId('plan_id')->nullable()->after('suscripcion_expira_en')->constrained('planes')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropColumn(['estado_suscripcion', 'suscripcion_expira_en', 'plan_id']);
        });
    }
};
