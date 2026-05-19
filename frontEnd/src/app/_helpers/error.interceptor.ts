import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AccountService } from '@app/_services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private accountService: AccountService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError(err => {
      if ([401, 403].includes(err.status) && this.accountService.accountValue) {
        this.accountService.logout();
      }

      console.error('HTTP Error Response:', err);

      let errorMessage = 'An unknown error occurred';
      if (err.error) {
        if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.error.message) {
          errorMessage = err.error.message;
        } else if (err.error.error) {
          errorMessage = err.error.error;
        } else {
          try {
            errorMessage = JSON.stringify(err.error);
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
    }));
  }
}
