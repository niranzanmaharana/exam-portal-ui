import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isPublicExamPage: boolean = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Check if current route is a public exam page
    this.checkIfPublicExamPage();
    
    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkIfPublicExamPage();
    });
  }

  private checkIfPublicExamPage(): void {
    const url = this.router.url;
    this.isPublicExamPage = url.includes('/exam-access/') || 
                           url.includes('/exam-instructions/') || 
                           url.includes('/exam-taking/');
  }

  get userInitial(): string {
    const username = this.authService.getCurrentUser()?.username;
    return username ? username.charAt(0).toUpperCase() : 'U';
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  navigateToChangePassword(): void {
    this.router.navigate(['/change-password']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
