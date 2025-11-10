<?php

namespace Database\Seeders;

use App\Models\Ejercicio;
use App\Models\Rutina;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // Crea 20 ejercicios usando el factory
        \App\Models\Ejercicio::factory(20)->create();

        // Obtiene el primer trainee
        $trainee = \App\Models\User::whereHas('roles', fn($q)=>$q->where('name','trainee'))->first();
        if ($trainee) {
            //Crea una rutina asociada al trainee obtenido.
            $r = \App\Models\Rutina::create([
                'user_id'=>$trainee->id,
                'nombre'=>'Rutina Demo',
                'descripcion'=>'Ejemplo con ejercicios',
            ]);

            // Selecciona 5 ejercicios aleatorios
            $ejercicios = \App\Models\Ejercicio::inRandomOrder()->take(5)->get();
            $attach = [];

            // Asocia aleatoriamente series, repeticiones y descanso a cada ejercicio
            foreach ($ejercicios as $e) {
                $attach[$e->id] = [
                    'series' => rand(3,5),
                    'repeticiones' => rand(8,15),
                    'descanso' => [60,90,120][array_rand([0,1,2])],
                ];
            }
            // Asocia los ejercicios a la rutina creada
            $r->ejercicios()->attach($attach);
        }
    }
}
