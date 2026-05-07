import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { AlertService, AccountService } from '@app/_services';
import { Account, Role } from '@app/_models';

const accounts: Account[] = [];

@Injectable()
export class FakeBackendInterceptor implements HttpInterceptor {
  constructor(
    private alertService: AlertService,
    private accountService: AccountService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const { url, method, headers, body } = request;

    return handleRoute();

    function handleRoute() {
      switch (true) {
        case url.match(/\/accounts\/authenticate$/) && method === 'POST':
          return authenticate();
        case url.match(/\/accounts\/register$/) && method === 'POST':
          return register();
        case url.match(/\/accounts\/verify-email$/) && method === 'POST':
          return verifyEmail();
        case url.match(/\/accounts\/forgot-password$/) && method === 'POST':
          return forgotPassword();
        case url.match(/\/accounts\/validate-reset-token$/) && method === 'POST':
          return validateResetToken();
        case url.match(/\/accounts\/reset-password$/) && method === 'POST':
          return resetPassword();
        case url.match(/\/accounts\/refresh-token$/) && method === 'POST':
          return refreshToken();
        case url.match(/\/accounts\/revoke-token$/) && method === 'POST':
          return revokeToken();
        case url.match(/\/accounts$/) && method === 'GET':
          return getAccounts();
        case url.match(/\/accounts\/\d+$/) && method === 'GET':
          return getAccountById();
        case url.match(/\/accounts$/) && method === 'POST':
          return createAccount();
        case url.match(/\/accounts\/\d+$/) && method === 'PUT':
          return updateAccount();
        case url.match(/\/accounts\/\d+$/) && method === 'DELETE':
          return deleteAccount();
        default:
          return next.handle(request);
      }
    }

    function authenticate() {
      const { email, password } = body;
      const account = accounts.find(x => x.email === email && x.email && password);

      if (!account) {
        return errorResponse('Email or password is incorrect');
      }

      return okResponse(jwt(account));
    }

    function register() {
      const account = body;

      if (accounts.find(x => x.email === account.email)) {
        return errorResponse('Email already registered');
      }

      if (accounts.length === 0) {
        account.role = Role.Admin;
      } else {
        account.role = Role.User;
      }

      account.id = getId();
      account.dateCreated = new Date();
      account.isVerified = false;
      accounts.push(account);

      const token = generateVerifyEmailToken();
      const verifyUrl = `${environment.appUrl}/account/verify-email?token=${token}`;

      this.alertService.info(`Verification Email\n\nTo verify your account please click the link below:\n\n${verifyUrl}\n\nThis link expires after 24 hours.`);

      return okResponse();
    }

    function verifyEmail() {
      const { token } = body;
      const account = accounts.find(x => x.verifyEmailToken === token && new Date(x.verifyEmailExpires) > new Date());

      if (!account) {
        return errorResponse('Verify email token is invalid');
      }

      account.verified = new Date();
      account.isVerified = true;

      return okResponse();
    }

    function forgotPassword() {
      const { email } = body;
      const account = accounts.find(x => x.email === email);

      if (!account) {
        return okResponse();
      }

      const token = generateResetToken();
      account.resetToken = token;
      account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const resetUrl = `${environment.appUrl}/account/reset-password?token=${token}`;

      this.alertService.info(`Forgot Password Email\n\nTo reset your password please click the link below:\n\n${resetUrl}\n\nThis link expires after 24 hours.`);

      return okResponse();
    }

    function validateResetToken() {
      const { token } = body;
      const account = accounts.find(x => x.resetToken === token && new Date(x.resetTokenExpires) > new Date());

      if (!account) {
        return errorResponse('Reset token is invalid');
      }

      return okResponse();
    }

    function resetPassword() {
      const { token, password, confirmPassword } = body;

      if (password !== confirmPassword) {
        return errorResponse('Password and confirm password do not match');
      }

      const account = accounts.find(x => x.resetToken === token && new Date(x.resetTokenExpires) > new Date());

      if (!account) {
        return errorResponse('Reset token is invalid');
      }

      account.password = password;
      account.resetToken = null;
      account.resetTokenExpires = null;

      return okResponse();
    }

    function refreshToken() {
      const account = this.accountService.accountValue;

      if (!account) {
        return errorResponse('Invalid token');
      }

      const refreshedAccount = accounts.find(x => x.id === account.id);

      if (!refreshedAccount) {
        return errorResponse('Invalid token');
      }

      return okResponse(jwt(refreshedAccount));
    }

    function revokeToken() {
      if (!this.accountService.accountValue) {
        return errorResponse('Invalid token');
      }

      return okResponse();
    }

    function getAccounts() {
      if (!isLoggedIn()) return unauthorized();

      if (!hasRole(Role.Admin)) return forbidden();

      return okResponse(accounts.map(x => omitPassword(x)));
    }

    function getAccountById() {
      if (!isLoggedIn()) return unauthorized();

      const account = this.accountService.accountValue;
      const id = getRouteId();

      if (id !== account?.id && !hasRole(Role.Admin)) return forbidden();

      const responseAccount = accounts.find(x => x.id == id);

      if (!responseAccount) return notFound();

      return okResponse(omitPassword(responseAccount));
    }

    function createAccount() {
      if (!isLoggedIn()) return unauthorized();

      if (!hasRole(Role.Admin)) return forbidden();

      const account = body;

      if (accounts.find(x => x.email === account.email)) {
        return errorResponse('Email already registered');
      }

      account.id = getId();
      account.dateCreated = new Date();
      account.role = Role.User;
      account.isVerified = true;
      accounts.push(account);

      return okResponse();
    }

    function updateAccount() {
      if (!isLoggedIn()) return unauthorized();

      const id = getRouteId();
      const account = this.accountService.accountValue;

      if (id !== account?.id && !hasRole(Role.Admin)) return forbidden();

      const responseAccount = accounts.find(x => x.id == id);

      if (!responseAccount) return notFound();

      if (body.email && responseAccount.email !== body.email && accounts.find(x => x.email === body.email)) {
        return errorResponse('Email already registered');
      }

      Object.assign(responseAccount, body);

      return okResponse();
    }

    function deleteAccount() {
      if (!isLoggedIn()) return unauthorized();

      const id = getRouteId();
      const account = this.accountService.accountValue;

      if (id !== account?.id && !hasRole(Role.Admin)) return forbidden();

      const responseAccount = accounts.find(x => x.id == id);

      if (!responseAccount) return notFound();

      accounts.splice(accounts.indexOf(responseAccount), 1);

      return okResponse();
    }

    function okResponse(body?: any) {
      return of(new HttpResponse({ status: 200, body })).pipe(delay(500));
    }

    function errorResponse(message: string) {
      return throwError(() => ({ status: 400, error: { message } }));
    }

    function unauthorized() {
      return throwError(() => ({ status: 401, error: { message: 'Unauthorized' } }));
    }

    function forbidden() {
      return throwError(() => ({ status: 403, error: { message: 'Forbidden' } }));
    }

    function notFound() {
      return throwError(() => ({ status: 404, error: { message: 'Not Found' } }));
    }

    function isLoggedIn() {
      return !!this.accountService.accountValue;
    }

    function hasRole(role: Role) {
      return this.accountService.accountValue?.role === role;
    }

    function omitPassword(account: Account) {
      const { password, ...accountWithoutPassword } = account;
      return accountWithoutPassword;
    }

    function jwt(account: Account) {
      const token = generateJWT(account);
      const refreshToken = generateRefreshToken();

      account.jwtToken = token;
      account.refreshToken = refreshToken;
      account.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return {
        id: account.id,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        jwtToken: token,
        refreshToken: refreshToken
      };
    }

    function getId() {
      return accounts.length ? Math.max(...accounts.map(x => parseInt(x.id!))) + 1 : 1;
    }
  }
}

function generateJWT(account: Account) {
  const token = {
    sub: account.id,
    email: account.email,
    role: account.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60)
  };

  const header = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  const payload = btoa(JSON.stringify(token));
  const signature = btoa('secret');

  return `${header}.${payload}.${signature}`;
}

function generateRefreshToken() {
  return 'fake-refresh-token-' + Math.random().toString(36).substr(2, 9);
}

function generateVerifyEmailToken() {
  return 'fake-verify-email-token-' + Math.random().toString(36).substr(2, 9);
}

function generateResetToken() {
  return 'fake-reset-token-' + Math.random().toString(36).substr(2, 9);
}

import { HttpResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
