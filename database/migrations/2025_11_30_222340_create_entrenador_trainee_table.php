<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('entrenador_trainee', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrenador_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('trainee_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['entrenador_id', 'trainee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entrenador_trainee');
    }
};
