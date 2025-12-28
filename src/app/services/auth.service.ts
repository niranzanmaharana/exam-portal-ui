import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  mobileNumber?: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  email: string;
  role: string;
  id: number;
  registrationCode?: string;
  firstName?: string;
  lastName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.storeUser(response);
        this.currentUserSubject.next(response);
      })
    );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): LoginResponse | null {
    // Always try to get user from token first (most reliable)
    const userFromToken = this.getUserFromToken();
    if (userFromToken) {
      // Update the subject if token data is different
      if (!this.currentUserSubject.value ||
        this.currentUserSubject.value.role !== userFromToken.role ||
        this.currentUserSubject.value.username !== userFromToken.username) {
        this.currentUserSubject.next(userFromToken);
      }
      return userFromToken;
    }

    // Fallback to cached value
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'ADMIN';
  }

  isOrganizer(): boolean {
    return this.getCurrentUser()?.role === 'ORGANIZER';
  }

  isCandidate(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'CANDIDATE';
  }

  private storeUser(user: LoginResponse): void {
    localStorage.setItem('token', user.token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  private getUserFromToken(): LoginResponse | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decoded = this.decodeToken(token);
      if (!decoded) {
        return null;
      }

      // Check if this is an old token (only has sub, iat, exp - no user details)
      const isOldToken = !decoded.role && !decoded.email && !decoded.id && decoded.sub;

      if (isOldToken) {
        // Old token without user details - return null to fall back to stored user data
        // User should log in again to get a new token with all user details
        return null;
      }

      const user: LoginResponse = {
        token: token,
        username: decoded.sub || decoded.username || '',
        email: decoded.email || '',
        role: (decoded.role || '').toUpperCase(), // Ensure role is uppercase
        id: decoded.id ? Number(decoded.id) : 0,
        registrationCode: decoded.registrationCode || undefined,
        firstName: decoded.firstName || undefined,
        lastName: decoded.lastName || undefined
      };

      // Only log warning if role is missing but other user fields exist (unexpected case)
      if (!user.role && (user.email || user.id)) {
        console.warn('Role not found in token, but other user details exist. Please log in again to refresh your token.');
      }

      return user;
    } catch (error) {
      console.error('Error extracting user from token:', error);
      return null;
    }
  }

  private getStoredUser(): LoginResponse | null {
    // First try to get user from token (most reliable)
    const userFromToken = this.getUserFromToken();
    if (userFromToken) {
      return userFromToken;
    }

    // Fallback to stored user in localStorage
    // This handles old tokens that don't have user details
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const storedUser = JSON.parse(userStr);
        // If stored user has role and other details, use it
        // Otherwise, it's an old token and user should log in again
        if (storedUser && storedUser.role) {
          return storedUser;
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        return null;
      }
    }

    return null;
  }

  private loadStoredUser(): void {
    const user = this.getStoredUser();
    if (user) {
      // Update stored user with token data to ensure consistency
      this.storeUser(user);
      this.currentUserSubject.next(user);
    }
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, {
      token,
      newPassword
    });
  }
}
