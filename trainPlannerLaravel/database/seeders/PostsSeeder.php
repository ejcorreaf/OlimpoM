<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PostsSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::role('admin')->first();

        if (!$admin) {
            $admin = User::first();
        }

        $posts = [
            [
                'title' => '5 Ejercicios Clave para Ganar Fuerza',
                'excerpt' => 'Descubre los ejercicios fundamentales que todo principiante debería dominar para construir una base sólida de fuerza.',
                'content' => '<p>La construcción de fuerza requiere consistencia y técnica adecuada. Estos 5 ejercicios deberían ser la base de tu rutina:</p>
                <h3>1. Sentadillas</h3>
                <p>El rey de los ejercicios para piernas. Trabaja múltiples grupos musculares simultáneamente.</p>
                <h3>2. Press de Banca</h3>
                <p>Fundamental para el desarrollo del pecho, hombros y tríceps.</p>
                <h3>3. Peso Muerto</h3>
                <p>Excelente para la cadena posterior y fuerza general.</p>
                <h3>4. Dominadas</h3>
                <p>El mejor ejercicio para la espalda y bíceps con peso corporal.</p>
                <h3>5. Press Militar</h3>
                <p>Desarrolla hombros fuertes y estables.</p>',
                'category' => 'ejercicios',
                'image_url' => 'https://images.unsplash.com/photo-1534367507877-0edd93bd013b?w=800&auto=format&fit=crop',
                'view_count' => 245
            ],
            [
                'title' => 'La Importancia de la Proteína en el Desarrollo Muscular',
                'excerpt' => 'Guía completa sobre cuánta proteína necesitas y las mejores fuentes para optimizar tu crecimiento muscular.',
                'content' => '<p>La proteína es el componente básico del músculo. Sin suficiente proteína, tus ganancias de fuerza y masa muscular se verán comprometidas.</p>
                <h3>¿Cuánta proteína necesitas?</h3>
                <p>Para atletas y personas activas: 1.6-2.2g por kg de peso corporal.</p>
                <h3>Mejores Fuentes</h3>
                <ul>
                    <li>Pollo, pavo y carne magra</li>
                    <li>Pescado (salmón, atún)</li>
                    <li>Huevos enteros</li>
                    <li>Legumbres y lentejas</li>
                    <li>Suplementos de proteína de suero</li>
                </ul>
                <h3>Timing Importante</h3>
                <p>Distribuir la ingesta a lo largo del día es más efectivo que una sola comida grande.</p>',
                'category' => 'nutricion',
                'image_url' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w-800&auto=format&fit=crop',
                'view_count' => 189
            ],
            [
                'title' => 'Cómo Planificar tu Semana de Entrenamiento',
                'excerpt' => 'Aprende a estructurar tus entrenamientos para maximizar resultados y evitar el sobreentrenamiento.',
                'content' => '<p>Una planificación adecuada puede marcar la diferencia entre progresar o estancarse.</p>
                <h3>Principios Básicos</h3>
                <p>1. Dividir por grupos musculares<br>2. Alternar días intensos y ligeros<br>3. Incluir descanso activo</p>
                <h3>Ejemplo de Rutina Semanal</h3>
                <p><strong>Lunes:</strong> Pecho y tríceps<br><strong>Martes:</strong> Espalda y bíceps<br><strong>Miércoles:</strong> Piernas<br><strong>Jueves:</strong> Descanso activo<br><strong>Viernes:</strong> Hombros y abdominales<br><strong>Sábado:</strong> Cardio<br><strong>Domingo:</strong> Descanso completo</p>
                <h3>Ajusta a tu Nivel</h3>
                <p>Los principiantes pueden necesitar menos frecuencia, mientras los avanzados pueden requerir mayor volumen.</p>',
                'category' => 'consejos',
                'image_url' => 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format&fit=crop',
                'view_count' => 312
            ],
            [
                'title' => 'Beneficios del Entrenamiento de Fuerza para la Salud',
                'excerpt' => 'Más allá del aspecto físico: cómo el entrenamiento con pesas mejora tu salud general.',
                'content' => '<p>El entrenamiento de fuerza ofrece beneficios que van mucho más allá de la apariencia física.</p>
                <h3>Salud Ósea</h3>
                <p>Previene la osteoporosis y fortalece los huesos, especialmente importante con la edad.</p>
                <h3>Salud Metabólica</h3>
                <p>Mejora la sensibilidad a la insulina y ayuda a controlar los niveles de azúcar en sangre.</p>
                <h3>Salud Mental</h3>
                <p>Libera endorfinas, reduce el estrés y mejora la calidad del sueño.</p>
                <h3>Independencia en la Edad Avanzada</h3>
                <p>Mantener la fuerza funcional permite una vida independiente por más tiempo.</p>',
                'category' => 'salud',
                'image_url' => 'https://images.unsplash.com/photo-1534367507877-0edd93bd013b?w=800&auto=format&fit=crop',
                'view_count' => 167
            ],
            [
                'title' => 'Cómo Usar TrainPlanner para Optimizar tus Entrenamientos',
                'excerpt' => 'Consejos y trucos para sacar el máximo provecho de nuestra plataforma de gestión de entrenamientos.',
                'content' => '<p>TrainPlanner está diseñado para simplificar tu vida fitness. Aquí algunos tips:</p>
                <h3>1. Programar Recordatorios</h3>
                <p>Usa la función de recordatorios para nunca saltarte un entrenamiento.</p>
                <h3>2. Registrar tu Progreso</h3>
                <p>Lleva un diario de tus pesos y repeticiones para ver tu evolución.</p>
                <h3>3. Comunicación con tu Entrenador</h3>
                <p>Utiliza el chat integrado para resolver dudas rápidamente.</p>
                <h3>4. Rutinas Personalizadas</h3>
                <p>Trabaja con tu entrenador para crear rutinas adaptadas a tus objetivos específicos.</p>',
                'category' => 'tecnologia',
                'image_url' => 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop',
                'view_count' => 98
            ]
        ];

        foreach ($posts as $postData) {
            Post::create(array_merge($postData, [
                'slug' => Str::slug($postData['title']),
                'user_id' => $admin->id,
                'is_published' => true,
                'published_at' => now()->subDays(rand(1, 30))
            ]));
        }

        $this->command->info('5 posts de ejemplo creados exitosamente.');
    }
}
