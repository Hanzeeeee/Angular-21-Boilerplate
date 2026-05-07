import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { Account } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private accountSubject: BehaviorSubject<Account | null>;
  public account: Observable<Account | null>;

  private refreshTokenTimeout?: NodeJS.Timeout;

  constructor(private http: HttpClient) {
    this.accountSubject = new BehaviorSubject(this.getAccountFromStorage());
    this.account = this.accountSubject.asObservable();
  }

  public get accountValue(): Account | null {
    return this.accountSubject.value;
  }

  login(email: string, password: string) {
    return this.http.post<Account>(`${environment.apiUrl}/accounts/authenticate`, { email, password })
      .pipe(map(account => {
        this.setAccount(account);
        this.startRefreshTokenTimer();
        return account;
      }));
  }

  register(account: Account) {
    return this.http.post(`${environment.apiUrl}/accounts/register`, account);
  }

  verifyEmail(token: string) {
    return this.http.post(`${environment.apiUrl}/accounts/verify-email`, { token });
  }

  forgotPassword(email: string) {
    return this.http.post(`${environment.apiUrl}/accounts/forgot-password`, { email });
  }

  validateResetToken(token: string) {
    return this.http.post(`${environment.apiUrl}/accounts/validate-reset-token`, { token });
  }

  resetPassword(token: string, password: string, confirmPassword: string) {
    return this.http.post(`${environment.apiUrl}/accounts/reset-password`, { token, password, confirmPassword });
  }

  refreshToken() {
    return this.http.post<Account>(`${environment.apiUrl}/accounts/refresh-token`, {})
      .pipe(map(account => {
        this.setAccount(account);
        this.startRefreshTokenTimer();
        return account;
      }));
  }

  logout() {
    this.http.post(`${environment.apiUrl}/accounts/revoke-token`, {})
      .subscribe();
    this.stopRefreshTokenTimer();
    this.clearAccount();
  }

  getAll() {
    return this.http.get<Account[]>(`${environment.apiUrl}/accounts`);
  }

  getById(id: string) {
    return this.http.get<Account>(`${environment.apiUrl}/accounts/${id}`);
  }

  create(account: Account) {
    return this.http.post(`${environment.apiUrl}/accounts`, account);
  }

  update(id: string, account: Account) {
    return this.http.put(`${environment.apiUrl}/accounts/${id}`, account)
      .pipe(map(x => {
        if (id === this.accountValue?.id) {
          this.setAccount(account);
        }
        return x;
      }));
  }

  delete(id: string) {
    return this.http.delete(`${environment.apiUrl}/accounts/${id}`)
      .pipe(finalize(() => {
        if (id === this.accountValue?.id) {
          this.logout();
        }
      }));
  }

  private setAccount(account: Account) {
    let needs_cookie = false;
    if (account.refreshToken) {
      needs_cookie = true;
      localStorage.setItem('refreshToken', account.refreshToken);
    }
    this.accountSubject.next(account);
  }

  private clearAccount() {
    localStorage.removeItem('refreshToken');
    this.accountSubject.next(null);
  }

  private getAccountFromStorage(): Account | null {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      return { refreshToken } as Account;
    }
    return null;
  }

  private startRefreshTokenTimer() {
    if (!this.accountValue?.jwtToken) return;
    const jwtToken = this.accountValue.jwtToken;
    const decoded = this.parseJwt(jwtToken);
    const expires = new Date(decoded.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (1 * 60 * 1000);

    this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
  }

  private stopRefreshTokenTimer() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  private parseJwt(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }
}
