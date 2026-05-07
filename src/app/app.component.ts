import { Component, OnInit } from '@angular/core';
import { AccountService } from '@app/_services';
import { Account, Role } from '@app/_models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  account?: Account | null;

  constructor(private accountService: AccountService) { }

  ngOnInit() {
    this.accountService.account.subscribe(x => this.account = x);
  }

  get isAdmin() {
    return this.account?.role === Role.Admin;
  }

  logout() {
    this.accountService.logout();
  }
}
