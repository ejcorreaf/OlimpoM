<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suscripciones', function (Blueprint $table) {
            // Añadir columnas que faltan según los errores
            $table->boolean('es_cambio_plan')->default(false)->after('transaccion_id');
            $table->json('datos_pago')->nullable()->after('datos_facturacion');
        });
    }

    public function down(): void
    {
        Schema::table('suscripciones', function (Blueprint $table) {
            $table->dropColumn(['es_cambio_plan', 'datos_pago']);
        });
    }
};
