<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasRoles, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'photo_url', 'dni', 'notes',
        'estado_suscripcion', 'suscripcion_expira_en', 'plan_id'
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'suscripcion_expira_en' => 'datetime',
        ];
    }

    protected $appends = ['entrenador_asignado', 'tiene_suscripcion_activa'];

    public function getEntrenadorAsignadoAttribute()
    {
        $entrenador = $this->entrenadorAsignado()->first();

        if (!$entrenador) {
            return null;
        }

        return [
            'id' => $entrenador->id,
            'name' => $entrenador->name,
            'email' => $entrenador->email,
            'photo_url' => $entrenador->photo_url,
            'role' => 'trainer'
        ];
    }

    public function getTieneSuscripcionActivaAttribute()
    {
        if ($this->hasRole('trainee')) {
            return $this->estado_suscripcion === 'activa' &&
                (!$this->suscripcion_expira_en || $this->suscripcion_expira_en > now());
        }
        return true; // Admin y trainer siempre tienen "acceso"
    }

    // Relaciones existentes...
    public function traineesAsignados()
    {
        return $this->belongsToMany(User::class, 'entrenador_trainee', 'entrenador_id', 'trainee_id')
            ->withTimestamps();
    }

    public function entrenadorAsignado()
    {
        return $this->belongsToMany(User::class, 'entrenador_trainee', 'trainee_id', 'entrenador_id')
            ->withTimestamps();
    }

    public function mensajesEnviados()
    {
        return $this->hasMany(Mensaje::class, 'emisor_id');
    }

    public function mensajesRecibidos()
    {
        return $this->hasMany(Mensaje::class, 'receptor_id');
    }

    // Nuevas relaciones para suscripciones
    public function plan()
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function suscripciones()
    {
        return $this->hasMany(Suscripcion::class, 'usuario_id');
    }

    public function suscripcionActiva()
    {
        return $this->hasOne(Suscripcion::class, 'usuario_id')
            ->where('estado', 'activa')
            ->where(function($q) {
                $q->whereNull('expira_en')
                    ->orWhere('expira_en', '>', now());
            })
            ->latest();
    }

    // Helper para saber si tiene entrenador asignado
    public function tieneEntrenadorAsignado(): bool
    {
        return $this->entrenadorAsignado()->exists();
    }

    // Helper para suscripciones
    public function tieneSuscripcionActiva(): bool
    {
        return $this->tiene_suscripcion_activa;
    }

    public function activarSuscripcion($planId, $metodoPago = 'manual', $datosFacturacion = null, $duracionDias = 30)
    {
        // Crear suscripción
        $suscripcion = Suscripcion::create([
            'usuario_id' => $this->id,
            'plan_id' => $planId,
            'estado' => 'activa',
            'inicio_en' => now(),
            'expira_en' => now()->addDays($duracionDias),
            'metodo_pago' => $metodoPago,
            'datos_facturacion' => $datosFacturacion,
            'transaccion_id' => 'manual_' . now()->timestamp
        ]);

        // Actualizar usuario
        $this->update([
            'estado_suscripcion' => 'activa',
            'suscripcion_expira_en' => now()->addDays($duracionDias),
            'plan_id' => $planId
        ]);

        return $suscripcion;
    }

    public function cancelarSuscripcion()
    {
        // Cancelar suscripción activa
        $this->suscripcionActiva()->update(['estado' => 'cancelada']);

        // Actualizar usuario
        $this->update([
            'estado_suscripcion' => 'ninguna',
            'suscripcion_expira_en' => null,
            'plan_id' => null
        ]);
    }
}
