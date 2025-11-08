<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rutina extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['user_id','nombre','descripcion'];

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function ejercicios()
    {
        return $this->belongsToMany(Ejercicio::class, 'ejercicios_en_rutinas')
            ->withPivot('series','repeticiones','descanso')
            ->withTimestamps();
    }
}
