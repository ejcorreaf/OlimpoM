<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suscripciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('plan_id')->constrained('planes')->onDelete('cascade');
            $table->enum('estado', ['activa', 'expirada', 'cancelada', 'pendiente'])->default('pendiente');
            $table->timestamp('inicio_en')->nullable();
            $table->timestamp('expira_en')->nullable();
            $table->enum('metodo_pago', ['paypal', 'tarjeta', 'manual'])->default('manual');
            $table->string('transaccion_id')->nullable();
            $table->json('datos_facturacion')->nullable();
            $table->timestamps();

            // Índices
            $table->index(['usuario_id', 'estado']);
            $table->index('expira_en');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suscripciones');
    }
};
