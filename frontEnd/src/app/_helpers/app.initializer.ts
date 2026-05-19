import { catchError, of } from 'rxjs';
import { AccountService } from '@app/services';

export function appInitializer(accountService: AccountService) {
  return () => accountService.refreshToken().pipe(catchError(() => of(null)));
}

