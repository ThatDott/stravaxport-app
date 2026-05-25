import { Routes } from '@angular/router';
import { AuthCallbackComponent } from './shared/auth-callback.component';
import { AuthWallComponent } from './shared/auth-wall.component';
import { HomeComponent } from './shared/home.component';

export const routes: Routes = [
  {
    path: 'auth/callback',
    component: AuthCallbackComponent
  },
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'auth-wall',
    component: AuthWallComponent
  },
  {
    path: '**',
    redirectTo: ''
  },
];
