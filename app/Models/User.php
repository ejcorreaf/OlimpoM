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
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected $appends = ['entrenador_asignado'];

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

    // NUEVO: Helper para saber si tiene entrenador asignado
    public function tieneEntrenadorAsignado(): bool
    {
        return $this->entrenadorAsignado()->exists();
    }
}
