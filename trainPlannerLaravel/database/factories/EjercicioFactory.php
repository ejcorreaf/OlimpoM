<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory para la creación de instancias de Ejercicio.
 *
 * Este factory se utiliza para generar datos de prueba para la
 * tabla `ejercicios` en la base de datos, permitiendo
 * la automatización de pruebas y la creación de datos
 * falsos para entornos de desarrollo.
 *
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ejercicio>
 */
class EjercicioFactory extends Factory
{
    // Asocia el modelo Ejercicio con este factory
    protected $model = \App\Models\Ejercicio::class;

    public function definition(): array
    {
        return [
            'nombre' => $this->faker->unique()->words(2, true),
            'descripcion' => $this->faker->sentence(10),
            'grupo_muscular' => $this->faker->randomElement(['pecho','espalda','pierna','hombro','brazo','core']),
            'foto' => null,
        ];
    }
}

