import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first, finalize } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/services';
import { mustMatch } from '@app/helpers';
import { RegisterRequest } from '@app/models';

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
    const registerRequest: RegisterRequest = {
      title: this.f.title.value,
      firstName: this.f.firstName.value,
      lastName: this.f.lastName.value,
      email: this.f.email.value.trim(),
      password: this.f.password.value,
      confirmPassword: this.f.confirmPassword.value,
      acceptTerms: this.f.acceptTerms.value
    };

    this.accountService.register(registerRequest)
      .pipe(
        first(),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response: any) => {
          const message = response?.message || 'Sign up successful, please check your email for verification instructions';
          this.alertService.success(message, { keepAfterRouteChange: true });
          this.router.navigate(['../login'], { relativeTo: this.route });
        },
        error: (error: any) => {
          console.error('Registration error:', error);
          const message = typeof error === 'string'
            ? error
            : error?.error?.message || error?.message || 'Registration failed. Please try again.';
          this.alertService.error(message);
        }
      });
  }
}
