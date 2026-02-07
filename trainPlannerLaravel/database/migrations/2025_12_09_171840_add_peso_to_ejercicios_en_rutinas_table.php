<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ejercicios_en_rutinas', function (Blueprint $table) {
            $table->decimal('peso', 8, 2)->nullable()->after('descanso')->comment('Peso en kg');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ejercicios_en_rutinas', function (Blueprint $table) {
            $table->dropColumn('peso');
        });
    }
};
