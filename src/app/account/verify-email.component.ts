import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html'
})
export class VerifyEmailComponent implements OnInit {
  tokenStatus?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.tokenStatus = 'Verifying';

    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this.tokenStatus = 'Failed';
      return;
    }

    this.accountService.verifyEmail(token)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Verification successful, you can now login');
          this.router.navigate(['../login'], { relativeTo: this.route });
        },
        error: () => {
          this.tokenStatus = 'Failed';
        }
      });
  }
}
