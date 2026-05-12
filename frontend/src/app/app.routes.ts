import { Routes } from '@angular/router';
import { AuthCallbackComponent } from './shared/auth-callback.component';
import { Component } from '@angular/core';

@Component({
  template: ''
})
class EmptyComponent {}

export const routes: Routes = [
  {
    path: 'auth/callback',
    component: AuthCallbackComponent
  },
  {
    path: '',
    component: EmptyComponent
  }
];
