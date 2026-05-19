import { Component, OnInit } from '@angular/core';
import { AccountService } from '@app/services';
import { Account } from '@app/models';

@Component({
  selector: 'app-profile-details',
  templateUrl: './details.component.html', standalone: false
})
export class DetailsComponent implements OnInit {
  account?: Account | null;

  constructor(private accountService: AccountService) { }

  ngOnInit() {
    this.account = this.accountService.accountValue;
  }
}

