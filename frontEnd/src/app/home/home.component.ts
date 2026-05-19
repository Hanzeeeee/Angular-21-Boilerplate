import { Component, OnInit } from '@angular/core';
import { AccountService } from '@app/services';
import { Account } from '@app/models';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  standalone: false
})
export class HomeComponent implements OnInit {
  account?: Account | null;

  constructor(private accountService: AccountService) { }

  ngOnInit() {
    this.account = this.accountService.accountValue;
  }
}

