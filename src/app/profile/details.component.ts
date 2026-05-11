import { Component, OnInit } from '@angular/core';
import { AccountService } from '@app/_services';
import { Account } from '@app/_models';

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
