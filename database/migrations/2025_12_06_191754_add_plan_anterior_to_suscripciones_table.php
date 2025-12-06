<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suscripciones', function (Blueprint $table) {
            $table->foreignId('plan_anterior_id')->nullable()->after('plan_id')->constrained('planes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('suscripciones', function (Blueprint $table) {
            $table->dropForeign(['plan_anterior_id']);
            $table->dropColumn('plan_anterior_id');
        });
    }
};
