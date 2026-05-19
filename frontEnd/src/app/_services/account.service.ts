import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Account } from '@app/_models';

export interface RegisterRequest {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

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
    this.accountSubject = new BehaviorSubject<Account | null>(JSON.parse(localStorage.getItem('account') || 'null') as Account | null);
    this.account = this.accountSubject.asObservable();
  }

  public get accountValue() {
    return this.accountSubject.value;
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${baseUrl}/authenticate`, { email, password }, { ...this.httpOptions, withCredentials: true })
      .pipe(map((account: any) => {
        localStorage.setItem('account', JSON.stringify(account));
        this.accountSubject.next(account as Account);
        this.startRefreshTokenTimer();
        return account;
      }));
  }

  logout() {
    this.http.post<any>(`${baseUrl}/revoke-token`, {}, { withCredentials: true }).subscribe();
    this.stopRefreshTokenTimer();
    this.accountSubject.next(null);
    localStorage.removeItem('account');
    this.router.navigate(['/account/login']);
  }

  refreshToken() {
    return this.http.post<any>(`${baseUrl}/refresh-token`, {}, { ...this.httpOptions, withCredentials: true })
      .pipe(map((account: any) => {
        localStorage.setItem('account', JSON.stringify(account));
        this.accountSubject.next(account as Account);
        this.startRefreshTokenTimer();
        return account;
      }));
  }

  register(account: RegisterRequest) {
    return this.http.post(`${baseUrl}/register`, account, this.httpOptions);
  }

  verifyEmail(token: string) {
    return this.http.post(`${baseUrl}/verify-email`, { token }, this.httpOptions);
  }

  forgotPassword(email: string) {
    return this.http.post(`${baseUrl}/forgot-password`, { email }, this.httpOptions);
  }

  validateResetToken(token: string) {
    return this.http.post(`${baseUrl}/validate-reset-token`, { token }, this.httpOptions);
  }

  resetPassword(token: string, password: string, confirmPassword: string) {
    return this.http.post(`${baseUrl}/reset-password`, { token, password, confirmPassword }, this.httpOptions);
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

  private startRefreshTokenTimer() {
    const jwtBase64 = this.accountValue?.jwtToken?.split('.')[1];
    if (!jwtBase64) {
      return;
    }

    const jwtToken = JSON.parse(atob(jwtBase64));
    const expires = new Date(jwtToken.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (60 * 1000);

    this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
  }

  private stopRefreshTokenTimer() {
    clearTimeout(this.refreshTokenTimeout);
  }
}
