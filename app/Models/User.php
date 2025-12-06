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

    public function cambiarPlan($nuevoPlanId, $metodoPago = 'tarjeta', $datosFacturacion = null)
    {
        $planAnterior = $this->plan;
        $nuevoPlan = Plan::findOrFail($nuevoPlanId);

        // Verificar si ya tiene este plan
        if ($this->plan_id == $nuevoPlanId) {
            throw new \Exception('Ya tienes este plan activo');
        }

        // Calcular días restantes de la suscripción actual
        $diasRestantes = 0;
        if ($this->suscripcion_expira_en) {
            $diasRestantes = now()->diffInDays($this->suscripcion_expira_en, false);
            if ($diasRestantes < 0) $diasRestantes = 0;
        }

        // Calcular prorrateo
        $precioDiarioAnterior = $planAnterior ? ($planAnterior->precio / 30) : 0;
        $precioDiarioNuevo = $nuevoPlan->precio / 30;
        $credito = $diasRestantes * $precioDiarioAnterior;
        $costoNuevoPlan = $diasRestantes * $precioDiarioNuevo;
        $diferencia = $costoNuevoPlan - $credito;

        // Si la diferencia es negativa, es un downgrade y aplica crédito
        // Si es positiva, es un upgrade y se cobra la diferencia
        $montoACobrar = max(0, $diferencia);
        $creditoAplicado = max(0, -$diferencia);

        Log::info('Cálculo cambio de plan', [
            'dias_restantes' => $diasRestantes,
            'precio_anterior' => $planAnterior?->precio,
            'precio_nuevo' => $nuevoPlan->precio,
            'monto_a_cobrar' => $montoACobrar,
            'credito_aplicado' => $creditoAplicado,
            'es_upgrade' => $montoACobrar > 0
        ]);

        // Si es downgrade y hay crédito, no se cobra nada
        if ($creditoAplicado > 0 && $montoACobrar == 0) {
            // Cambio gratuito (downgrade con crédito)
            $this->actualizarPlan($nuevoPlanId, $this->suscripcion_expira_en);
            return [
                'es_gratuito' => true,
                'credito_aplicado' => $creditoAplicado,
                'monto_cobrado' => 0
            ];
        }

        // Si hay que cobrar, devolver los datos para el pago
        return [
            'es_upgrade' => $montoACobrar > 0,
            'monto_a_cobrar' => $montoACobrar,
            'credito_aplicado' => $creditoAplicado,
            'dias_restantes' => $diasRestantes,
            'plan_anterior' => $planAnterior,
            'nuevo_plan' => $nuevoPlan
        ];
    }

    private function actualizarPlan($planId, $fechaExpiracion = null)
    {
        // Actualizar suscripción existente
        $suscripcion = $this->suscripcionActiva()->first();
        if ($suscripcion) {
            $suscripcion->update([
                'plan_id' => $planId,
                'es_cambio_plan' => true,
                'datos_cambio' => [
                    'fecha_cambio' => now(),
                    'plan_anterior_id' => $this->plan_id
                ]
            ]);
        }

        // Actualizar usuario
        $this->update([
            'plan_id' => $planId,
            'suscripcion_expira_en' => $fechaExpiracion ?: now()->addDays(30)
        ]);

        return $suscripcion;
    }
}
