import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/pet/pages/pet-dashboard/pet-dashboard.component').then(
            (m) => m.PetDashboardComponent
          ),
      },
      {
        path: 'blindaje',
        loadComponent: () =>
          import('./features/shielding/pages/shielding-dashboard/shielding-dashboard.component').then(
            (m) => m.ShieldingDashboardComponent
          ),
      },
      {
        path: 'decay',
        loadComponent: () =>
          import('./features/decay/pages/decay-dashboard/decay-dashboard.component').then(
            (m) => m.DecayDashboardComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
