import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Account, RegisterRequest, AuthResponse, Role } from '@app/models';

const baseUrl = `${environment.apiUrl}/accounts`;

@Injectable({ providedIn: 'root' })
export class AccountService {
  private accountSubject: BehaviorSubject<Account | null>;
  public account: Observable<Account | null>;
  private refreshTokenTimeout?: any;
  private readonly httpOptions = {
    headers: { 'Content-Type': 'application/json' }
  };

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    const savedAccount = localStorage.getItem('account');
    this.accountSubject = new BehaviorSubject<Account | null>(savedAccount ? JSON.parse(savedAccount) as Account : null);
    this.account = this.accountSubject.asObservable();
  }

  public get accountValue() {
    return this.accountSubject.value;
  }

  login(email: string, password: string) {
    const payload = {
      email: email.trim(),
      password: password.trim()
    };

    return this.http.post<AuthResponse>(`${baseUrl}/login`, payload, { ...this.httpOptions, withCredentials: true })
      .pipe(map(response => this.processAuthResponse(response)));
  }

  logout() {
    this.http.post<any>(`${baseUrl}/revoke-token`, {}, { withCredentials: true }).subscribe({
      next: () => {},
      error: () => {}
    });
    this.stopRefreshTokenTimer();
    this.accountSubject.next(null);
    localStorage.removeItem('account');
    this.router.navigate(['/account/login']);
  }

  refreshToken() {
    return this.http.post<AuthResponse>(`${baseUrl}/refresh-token`, {}, { ...this.httpOptions, withCredentials: true })
      .pipe(map(response => this.processAuthResponse(response)));
  }

  register(account: RegisterRequest) {
    return this.http.post<{ success: boolean; message: string }>(`${baseUrl}/register`, account, this.httpOptions);
  }

  verifyEmail(token: string) {
    return this.http.post<{ message: string }>(`${baseUrl}/verify-email`, { token }, this.httpOptions);
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${baseUrl}/forgot-password`, { email }, this.httpOptions);
  }

  validateResetToken(token: string) {
    return this.http.post<{ message: string }>(`${baseUrl}/validate-reset-token`, { token }, this.httpOptions);
  }

  resetPassword(token: string, password: string, confirmPassword: string) {
    return this.http.post<{ message: string }>(`${baseUrl}/reset-password`, { token, password, confirmPassword }, this.httpOptions);
  }

  getAll() {
    return this.http.get<Account[]>(baseUrl);
  }

  getById(id: string) {
    return this.http.get<Account>(`${baseUrl}/${id}`);
  }

  create(params: any) {
    return this.http.post(baseUrl, params, this.httpOptions);
  }

  update(id: string, params: any) {
    return this.http.put(`${baseUrl}/${id}`, params, this.httpOptions)
      .pipe(map((account: any) => {
        if (account.id === this.accountValue?.id) {
          const updatedAccount = { ...this.accountValue, ...account };
          localStorage.setItem('account', JSON.stringify(updatedAccount));
          this.accountSubject.next(updatedAccount);
        }
        return account;
      }));
  }

  delete(id: string) {
    return this.http.delete(`${baseUrl}/${id}`)
      .pipe(map((response: any) => {
        if (id === this.accountValue?.id) {
          this.logout();
        }
        return response;
      }));
  }

  private processAuthResponse(response: AuthResponse): Account {
    if (response?.success === false) {
      throw new Error(response.message || 'Authentication failed.');
    }

    // Extract user payload - backend may return user data directly or nested in 'user' property
    const payload = response?.user ?? response ?? {};
    
    // Extract JWT token with explicit fallbacks for different backend response formats
    // Try common JWT field names in order of preference
    let jwtToken = response?.jwtToken || 
                   payload.jwtToken || 
                   response?.token || 
                   payload.token || 
                   response?.accessToken || 
                   payload.accessToken;

    // Verify token was found
    if (!jwtToken || typeof jwtToken !== 'string' || jwtToken.trim() === '') {
      console.error('Authentication response missing valid JWT token:', { response, payload });
      throw new Error(response?.message || 'Authentication failed: missing access token. Please verify your login credentials.');
    }

    // Trim the token to remove any accidental whitespace
    jwtToken = jwtToken.trim();

    const account: Account = {
      id: payload.id ?? payload._id,
      title: payload.title,
      firstName: payload.firstName ?? payload.first_name,
      lastName: payload.lastName ?? payload.last_name,
      email: payload.email,
      role: payload.role,
      jwtToken
    };

    // Update local storage and notify subscribers of new account state
    localStorage.setItem('account', JSON.stringify(account));
    this.accountSubject.next(account);
    this.startRefreshTokenTimer();

    return account;
  }

  private startRefreshTokenTimer() {
    const jwtBase64 = this.accountValue?.jwtToken?.split('.')[1];
    if (!jwtBase64) {
      return;
    }

    const jwtToken = JSON.parse(atob(jwtBase64));
    const expires = new Date(jwtToken.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (60 * 1000);

    if (timeout <= 0) {
      return;
    }

    this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
  }

  private stopRefreshTokenTimer() {
    clearTimeout(this.refreshTokenTimeout);
  }
}
