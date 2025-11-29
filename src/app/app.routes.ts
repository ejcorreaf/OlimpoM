import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./features/home/home').then(m => m.Home) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) 
  },
  { 
    path: 'register', 
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent) 
  },

  {
    path: 'perfil',
    loadComponent: () => import('./features/perfil/perfil').then(m => m.PerfilComponent),
    canActivate: [authGuard]
  },

  // Rutas para Admin
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    children: [
      // Home de admin
      {
        path: 'home',
        loadComponent: () => import('./features/admin/admin-home/admin-home').then(m => m.AdminHomeComponent)
      },
      // Usuarios
      {
        path: 'usuarios',
        loadComponent: () => import('./features/admin/usuarios/usuarios-list/usuarios-list').then(m => m.AdminUsuariosListComponent)
      },
      {
        path: 'usuarios/nuevo',
        loadComponent: () => import('./features/admin/usuarios/usuario-form/usuario-form').then(m => m.AdminUsuarioFormComponent)
      },
      {
        path: 'usuarios/editar/:id',
        loadComponent: () => import('./features/admin/usuarios/usuario-form/usuario-form').then(m => m.AdminUsuarioFormComponent)
      },
      // Ejercicios
      {
        path: 'ejercicios',
        loadComponent: () => import('./features/admin/ejercicios/ejercicios-list/ejercicios-list').then(m => m.AdminEjerciciosListComponent)
      },
      {
        path: 'ejercicios/nuevo',
        loadComponent: () => import('./features/admin/ejercicios/ejercicios-form/ejercicios-form').then(m => m.AdminEjercicioFormComponent)
      },
      {
        path: 'ejercicios/editar/:id',
        loadComponent: () => import('./features/admin/ejercicios/ejercicios-form/ejercicios-form').then(m => m.AdminEjercicioFormComponent)
      },
      // Rutinas
      {
        path: 'rutinas',
        loadComponent: () => import('./features/admin/rutinas/rutinas-list/rutinas-list').then(m => m.AdminRutinasListComponent)
      },
      {
        path: 'rutinas/nuevo',
        loadComponent: () => import('./features/admin/rutinas/rutina-form/rutina-form').then(m => m.AdminRutinaFormComponent)
      },
      {
        path: 'rutinas/editar/:id',
        loadComponent: () => import('./features/admin/rutinas/rutina-form/rutina-form').then(m => m.AdminRutinaFormComponent)
      },
      {
        path: 'rutinas/:id/ejercicios',
        loadComponent: () => import('./features/admin/rutinas/asignar-ejercicios/asignar-ejercicios').then(m => m.AdminAsignarEjerciciosComponent)
      }
    ]
  },

  // Rutas para Entrenador
  {
    path: 'entrenador',
    canActivate: [authGuard, roleGuard],
    data: { role: 'trainer' },
    children: [
      // Home de entrenador
      {
        path: 'home',
        loadComponent: () => import('./features/entrenador/entrenador-home/entrenador-home').then(m => m.EntrenadorHomeComponent)
      },
      // Ejercicios
      {
        path: 'ejercicios',
        loadComponent: () => import('./features/entrenador/ejercicios/ejercicios-list/ejercicios-list').then(m => m.EjerciciosListComponent)
      },
      {
        path: 'ejercicios/nuevo',
        loadComponent: () => import('./features/entrenador/ejercicios/ejercicios-form/ejercicios-form').then(m => m.EjercicioFormComponent)
      },
      {
        path: 'ejercicios/editar/:id',
        loadComponent: () => import('./features/entrenador/ejercicios/ejercicios-form/ejercicios-form').then(m => m.EjercicioFormComponent)
      },
      // Rutinas
      {
        path: 'rutinas',
        loadComponent: () => import('./features/entrenador/rutinas/rutinas-list/rutinas-list').then(m => m.RutinasListComponent)
      },
      {
        path: 'rutinas/nuevo',
        loadComponent: () => import('./features/entrenador/rutinas/rutinas-form/rutinas-form').then(m => m.RutinaFormComponent)
      },
      {
        path: 'rutinas/editar/:id',
        loadComponent: () => import('./features/entrenador/rutinas/rutinas-form/rutinas-form').then(m => m.RutinaFormComponent)
      },
      {
        path: 'rutinas/:id/ejercicios',
        loadComponent: () => import('./features/entrenador/rutinas/asignar-ejercicios/asignar-ejercicios').then(m => m.AsignarEjerciciosComponent)
      }
    ]
  },

  // Rutas para Trainee
  {
    path: 'trainee',
    canActivate: [authGuard, roleGuard],
    data: { role: 'trainee' },
    children: [
      // Home de trainee
      {
        path: 'home',
        loadComponent: () => import('./features/trainee/trainee-home/trainee-home').then(m => m.TraineeHomeComponent)
      },
      {
        path: 'rutinas',
        loadComponent: () => import('./features/trainee/rutinas/rutinas-list/rutinas-list').then(m => m.TraineeRutinasListComponent)
      },
      {
        path: 'rutinas/:id',
        loadComponent: () => import('./features/trainee/rutinas/rutina-detalle/rutina-detalle').then(m => m.TraineeRutinaDetalleComponent)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];