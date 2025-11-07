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
        Schema::create('ejercicios_en_rutinas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rutina_id')->constrained('rutinas')->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('ejercicio_id')->constrained('ejercicios')->cascadeOnDelete()->cascadeOnUpdate();
            $table->integer('series')->default(3);
            $table->integer('repeticiones')->default(10);
            $table->integer('descanso')->default(60);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ejercicios_en_rutinas');
    }
};
