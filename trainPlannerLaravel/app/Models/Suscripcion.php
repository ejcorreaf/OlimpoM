<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Suscripcion extends Model
{
    use HasFactory;

    protected $table = 'suscripciones';

    protected $fillable = [
        'usuario_id',
        'plan_id',
        'plan_anterior_id',
        'estado',
        'inicio_en',
        'expira_en',
        'metodo_pago',
        'transaccion_id',
        'datos_facturacion',
        'datos_pago',
        'es_cambio_plan'
    ];

// Agregar al array $casts
    protected $casts = [
        'inicio_en' => 'datetime',
        'expira_en' => 'datetime',
        'datos_facturacion' => 'array',
        'datos_pago' => 'array',
        'es_cambio_plan' => 'boolean'
    ];

    // Scopes
    public function scopeActivas($query)
    {
        return $query->where('estado', 'activa')
            ->where(function($q) {
                $q->whereNull('expira_en')
                    ->orWhere('expira_en', '>', now());
            });
    }

    public function scopeDelUsuario($query, $usuarioId)
    {
        return $query->where('usuario_id', $usuarioId);
    }

    public function scopeRecientes($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    // Relaciones
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function planAnterior()
    {
        return $this->belongsTo(Plan::class, 'plan_anterior_id');
    }

    // Helpers
    public function estaActiva(): bool
    {
        return $this->estado === 'activa' &&
            (!$this->expira_en || $this->expira_en > now());
    }

    public function diasRestantes(): int
    {
        if (!$this->expira_en || !$this->estaActiva()) {
            return 0;
        }

        return now()->diffInDays($this->expira_en, false);
    }

    public function renovar()
    {
        $this->expira_en = now()->addDays($this->plan->duracion_dias);
        $this->save();
    }
}
