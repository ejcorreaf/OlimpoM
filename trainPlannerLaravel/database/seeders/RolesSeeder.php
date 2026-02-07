<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        //Crea el rol Admin
        $admin = Role::firstOrCreate(['name'=>'admin']);
        //Crea el rol de los entrenadores
        $trainer = Role::firstOrCreate(['name'=>'trainer']);
        //Crea el rol de los trainees
        $trainee = Role::firstOrCreate(['name'=>'trainee']);

        // Crea un usuario admin y le asigna el rol correspondiente
        $u1 = \App\Models\User::firstOrCreate(['email'=>'admin@example.com'],[
            'name'=>'Admin','password'=>Hash::make('password') //Asigna nombre y contraseña, la cual es hasheada
        ]); $u1->assignRole($admin);

        // Crea un usuario trainer y le asigna el rol correspondiente
        $u2 = \App\Models\User::firstOrCreate(['email'=>'trainer@example.com'],[
            'name'=>'Trainer','password'=>Hash::make('password')
        ]); $u2->assignRole($trainer);

        // Crea un usuario trainee y le asigna el rol correspondiente
        $u3 = \App\Models\User::firstOrCreate(['email'=>'trainee@example.com'],[
            'name'=>'Trainee','password'=>Hash::make('password')
        ]); $u3->assignRole($trainee);
    }
}
