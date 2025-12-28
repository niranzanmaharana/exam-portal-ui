import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip adding token for public endpoints
    const publicEndpoints = [
      '/auth/login', 
      '/auth/register', 
      '/auth/forgot-password', 
      '/auth/reset-password',
      '/auth/student-signup',
      '/exams/access/',
      '/exams/public/',
      '/questions/public/'
    ];
    const isPublicEndpoint = publicEndpoints.some(endpoint => request.url.includes(endpoint));
    
    // Get token from auth service
    const token = this.authService.getToken();
    
    // Clone the request and add the authorization header if token exists and it's not a public endpoint
    if (token && !isPublicEndpoint) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors only for authenticated endpoints
        // Don't interfere with 401 errors from public endpoints or public exam pages
        if (error.status === 401 && !isPublicEndpoint) {
          // Check if we're on a public exam page (don't redirect if we are)
          const currentUrl = this.router.url || window.location.pathname;
          const isPublicExamPage = currentUrl.includes('/exam-access/') ||
                                   currentUrl.includes('/exam-instructions/') ||
                                   currentUrl.includes('/exam-taking/') ||
                                   currentUrl.includes('/exam-acknowledgment');
          
          if (!isPublicExamPage) {
            // Token might be expired or invalid, logout user
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
        // For all other errors, pass through the error with proper message
        // The error object already contains the response body from the backend
        return throwError(() => error);
      })
    );
  }
}
