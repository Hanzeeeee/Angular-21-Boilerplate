import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';
import { Account } from '@app/_models';

@Component({
  selector: 'app-admin-accounts-list',
  templateUrl: './list.component.html'
})
export class ListComponent implements OnInit {
  accounts: Account[] = [];

  constructor(
    private accountService: AccountService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.accountService.getAll()
      .pipe(first())
      .subscribe(accounts => this.accounts = accounts);
  }

  deleteAccount(id: string) {
    const account = this.accounts.find(x => x.id === id);
    if (!account) return;

    account.isDeleting = true;
    this.accountService.delete(id)
      .pipe(first())
      .subscribe(() => {
        this.accounts = this.accounts.filter(x => x.id !== id);
        this.alertService.success('Account deleted successfully');
      },
      error => {
        this.alertService.error(error);
        account.isDeleting = false;
      });
  }
}
