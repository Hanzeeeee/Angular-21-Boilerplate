import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';
import { mustMatch } from '@app/_helpers';

@Component({
  selector: 'app-profile-update',
  templateUrl: './update.component.html'
})
export class UpdateComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  submitted = false;
  activeTab = 'details';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    const account = this.accountService.accountValue;

    this.form = this.formBuilder.group({
      title: [account?.title, Validators.required],
      firstName: [account?.firstName, Validators.required],
      lastName: [account?.lastName, Validators.required],
      email: [account?.email, [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      confirmPassword: ['']
    }, {
      validator: mustMatch('password', 'confirmPassword')
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.submitted = true;

    this.alertService.clear();

    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const id = this.accountService.accountValue?.id || '';
    this.accountService.update(id, this.form.value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Profile updated successfully', { keepAfterRouteChange: true });
          this.router.navigate(['..'], { relativeTo: this.route });
        },
        error: error => {
          this.alertService.error(error);
          this.loading = false;
        }
      });
  }

  deleteAccount() {
    if (confirm('Are you sure you want to delete your account?')) {
      this.loading = true;
      const id = this.accountService.accountValue?.id || '';
      this.accountService.delete(id)
        .pipe(first())
        .subscribe({
          next: () => {
            this.alertService.success('Account deleted successfully', { keepAfterRouteChange: true });
          },
          error: error => {
            this.alertService.error(error);
            this.loading = false;
          }
        });
    }
  }
}
