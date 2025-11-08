<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ejercicio extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['nombre','descripcion','grupo_muscular','foto'];

    public function rutinas()
    {
        return $this->belongsToMany(Rutina::class, 'ejercicios_en_rutinas')
            ->withPivot('series','repeticiones','descanso')
            ->withTimestamps();
    }
}
