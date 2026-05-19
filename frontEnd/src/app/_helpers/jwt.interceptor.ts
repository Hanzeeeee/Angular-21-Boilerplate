import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { AccountService } from '@app/services';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private accountService: AccountService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const account = this.accountService.accountValue;
    const jwtToken = account?.jwtToken ?? '';
    const isLoggedIn = !!jwtToken;
    const isApiUrl = request.url.startsWith(environment.apiUrl);

    // Only add Authorization header if user is logged in AND request is to the API
    // This prevents leaking JWT tokens to external URLs
    if (isLoggedIn && isApiUrl) {
      if (!jwtToken.trim()) {
        console.warn('JWT token is empty, skipping Authorization header');
        return next.handle(request);
      }

      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${jwtToken}`
        }
      });
    }

    return next.handle(request);
  }
}

