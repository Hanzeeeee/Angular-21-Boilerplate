import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first, finalize } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';
import { mustMatch } from '@app/_helpers';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: false
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      title: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    }, {
      validator: mustMatch('password', 'confirmPassword')
    });
  }

  get f() {
    return this.form.controls as any;
  }

  onSubmit() {
    this.submitted = true;
    this.alertService.clear();

    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.accountService.register(this.form.value as any)
      .pipe(
        first(),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: () => {
          this.alertService.success('Sign up successful, please check your email for verification instructions', { keepAfterRouteChange: true });
          this.router.navigate(['../login'], { relativeTo: this.route });
        },
        error: (error: any) => {
          console.error('Register error:', error);
          const message = typeof error === 'string' ? error : (error?.message || 'An error occurred during registration');
          this.alertService.error(message);
        }
      });
  }
}
