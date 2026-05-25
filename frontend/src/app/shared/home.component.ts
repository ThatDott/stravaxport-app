import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { DashboardComponent } from '../features/dashboard/dashboard.component';
import { AuthWallComponent } from './auth-wall.component';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthWallComponent, DashboardComponent],
  template: `
    @if (authService.isAuthenticated()) {
      <app-dashboard />
    } @else {
      <app-auth-wall />
    }
  `,
})
export class HomeComponent {
  readonly authService = inject(AuthService);
}
