import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Exam Portal';
  isPublicExamPage: boolean = false;

  constructor(private router: Router) {
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
    const url = this.router.url || window.location.pathname;
    this.isPublicExamPage = url.includes('/exam-access/') ||
                           url.includes('/exam-instructions/') ||
                           url.includes('/exam-taking/') ||
                           url.includes('/exam-acknowledgment') ||
                           url === '/login' ||
                           url === '/register';
  }
}
