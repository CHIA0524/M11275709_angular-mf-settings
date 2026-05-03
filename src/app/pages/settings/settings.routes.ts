import { Routes } from '@angular/router';

export const settingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./settings.component').then(m => m.SettingsComponent)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notification-settings/notification-settings.component').then(m => m.NotificationSettingsComponent)
  },
  {
    path: 'workspace',
    loadComponent: () => import('./settings-workspace/settings-workspace.component').then(m => m.SettingsWorkspaceComponent)
  }
];