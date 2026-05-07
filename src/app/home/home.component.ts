import { Component, OnInit } from '@angular/core';
import { AccountService } from '@app/_services';
import { Account } from '@app/_models';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  account?: Account | null;

  constructor(private accountService: AccountService) { }

  ngOnInit() {
    this.account = this.accountService.accountValue;
  }
}
