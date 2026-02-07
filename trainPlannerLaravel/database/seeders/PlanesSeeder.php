<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanesSeeder extends Seeder
{
    public function run(): void
    {
        $planes = [
            [
                'nombre' => 'Plan Básico',
                'descripcion' => '2 días de entrenamiento por semana',
                'precio' => 9.99,
                'dias_por_semana' => 2,
                'duracion_dias' => 30,
                'caracteristicas' => [
                    'Acceso a rutinas básicas',
                    'Chat con entrenador asignado',
                    'Seguimiento de progreso básico',
                    'App móvil incluida',
                    'Recordatorios de entrenamiento'
                ],
                'activo' => true,
                'orden' => 1
            ],
            [
                'nombre' => 'Plan Premium',
                'descripcion' => '3-5 días de entrenamiento por semana',
                'precio' => 14.99,
                'dias_por_semana' => 5,
                'duracion_dias' => 30,
                'caracteristicas' => [
                    'Acceso a todas las rutinas',
                    'Chat prioritario con entrenador',
                    'Seguimiento avanzado de progreso',
                    'Rutinas personalizadas',
                    'App móvil premium',
                    'Recordatorios inteligentes',
                    'Análisis de progreso detallado',
                    'Soporte prioritario 24/7'
                ],
                'activo' => true,
                'orden' => 2
            ]
        ];

        foreach ($planes as $plan) {
            Plan::create($plan);
        }

        $this->command->info('Planes creados exitosamente.');
    }
}
