<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $table = 'planes';

    protected $fillable = [
        'nombre',
        'descripcion',
        'precio',
        'dias_por_semana',
        'duracion_dias',
        'caracteristicas',
        'activo',
        'orden'
    ];

    protected $casts = [
        'precio' => 'decimal:2',
        'caracteristicas' => 'array',
        'activo' => 'boolean',
        'duracion_dias' => 'integer',
        'dias_por_semana' => 'integer',
        'orden' => 'integer'
    ];

    // Scopes
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function scopeOrdenados($query)
    {
        return $query->orderBy('orden')->orderBy('id');
    }

    // Relaciones
    public function usuarios()
    {
        return $this->hasMany(User::class, 'plan_id');
    }

    public function suscripciones()
    {
        return $this->hasMany(Suscripcion::class, 'plan_id');
    }
}
