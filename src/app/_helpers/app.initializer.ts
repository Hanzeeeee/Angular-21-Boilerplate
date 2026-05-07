import { Injectable } from '@angular/core';
import { AccountService } from '@app/_services';

@Injectable({ providedIn: 'root' })
export class AppInitializer {
  constructor(private accountService: AccountService) { }

  initialize() {
    return new Promise<void>((resolve) => {
      this.accountService.refreshToken().subscribe({
        next: () => resolve(),
        error: () => resolve()
      });
    });
  }
}
