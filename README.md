# OlimpoM ⛰️

**Aplicación web para la gestión de entrenamientos en gimnasio** 

**Backend en Laravel 12** + **Frontend en Angular 20**

[![Laravel](https://img.shields.io/badge/Laravel-12-ff2d20?style=flat&logo=laravel&logoColor=white)](https://laravel.com)
[![Angular](https://img.shields.io/badge/Angular-20-dd1b16?style=flat&logo=angular&logoColor=white)](https://angular.dev)
[![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?style=flat&logo=php&logoColor=white)](https://www.php.net)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

### ¿Qué es OlimpoM?

Plataforma pensada para **entrenadores personales** y **alumnos (trainees)** que quieren organizar y seguir rutinas de entrenamiento de forma estructurada.

- **Entrenadores** → crean ejercicios, diseñan rutinas personalizadas y las asignan a sus alumnos  
- **Trainees** → visualizan sus rutinas asignadas, marcan progreso y se comunican con su entrenador  
- **Administradores** → gestionan usuarios, ejercicios globales y supervisan la plataforma

### Estructura del proyecto

OlimpoM/
├── trainPlannerLaravel/     # Backend - API RESTful con Laravel 12
│   ├── app/
│   ├── routes/
│   ├── database/
│   └── ...
├── trainPlannerAngular/     # Frontend - SPA con Angular 20
│   ├── src/
│   ├── angular.json
│   └── ...
├── README.md
└── .gitignore



### Tecnologías principales

- **Backend**: Laravel 12 • PHP 8.2+ • MariaDB
- **Frontend**: Angular 20 • TypeScript • SCSS
- **Autenticación**: Laravel Sanctum
- **Base de datos**: Tabla central de **ejercicios** + relaciones para rutinas, asignaciones, progreso, usuarios (roles: admin, entrenador, trainee)

### Instalación rápida (en desarrollo local)

```bash
# 1. Clonar el repositorio
git clone https://github.com/ejcorreaf/OlimpoM.git
cd OlimpoM

# 2. Backend (Laravel)
cd trainPlannerLaravel
composer install
cp .env.example .env
php artisan key:generate
# Configura .env (DB, etc.)
php artisan migrate --seed
php artisan serve   # normalmente en http://localhost:8000

# 3. Frontend (Angular) – en otra terminal
cd ../trainPlannerAngular
npm install
ng serve            # normalmente en http://localhost:4200
```

### Funcionalidades actuales

+ Gestión completa de ejercicios (base de datos central)
+ Registro y roles de usuarios (admin, entrenador, trainee)
+ Creación y asignación de rutinas personalizadas
+ Comunicación básica entrenador ↔ trainee
+ Panel de administración
+ Autenticación segura + verificación de email

### Próximamente
+ Modalidad autodidacta (usuarios que se autogestionan rutinas)
+ Progreso detallado y estadísticas
+ Notificaciones push / email
+ Frontend Android
