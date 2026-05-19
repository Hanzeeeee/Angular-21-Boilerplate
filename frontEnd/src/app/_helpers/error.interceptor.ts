import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AccountService } from '@app/services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private accountService: AccountService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        if ([401, 403].includes(err.status) && this.accountService.accountValue) {
          this.accountService.logout();
        }

        console.error('HTTP Error Response:', err);

        let errorMessage = 'An unknown error occurred';
        const payload = err.error;

        if (payload) {
          if (typeof payload === 'string') {
            errorMessage = payload;
          } else if (payload.message) {
            errorMessage = payload.message;
          } else if (payload.error) {
            if (typeof payload.error === 'string') {
              errorMessage = payload.error;
            } else if (payload.error.message) {
              errorMessage = payload.error.message;
            } else if (Array.isArray(payload.error)) {
              errorMessage = payload.error.map((item: any) => item.message || item).join(' ');
            }
          } else if (Array.isArray(payload.errors) && payload.errors.length) {
            errorMessage = payload.errors.map((item: any) => item.message || item).join(' ');
          } else {
            try {
              const json = JSON.stringify(payload);
              if (json !== '{}' && json !== 'null') {
                errorMessage = json;
              }
            } catch {
              errorMessage = err.statusText || err.message || errorMessage;
            }
          }
        } else if (err.statusText) {
          errorMessage = err.statusText;
        } else if (err.message) {
          errorMessage = err.message;
        }

        return throwError(() => errorMessage);
      })
    );
  }
}


