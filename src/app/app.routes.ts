import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadChildren: () => import('./pages/settings/settings.routes').then((m) => m.settingsRoutes)
	}
];
