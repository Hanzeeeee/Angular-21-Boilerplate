import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first, finalize } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/services';
import { mustMatch } from '@app/helpers';

enum TokenStatus {
  Validating,
  Valid,
  Invalid
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  standalone: false
})
export class ResetPasswordComponent implements OnInit {
  TokenStatus = TokenStatus;
  tokenStatus = TokenStatus.Validating;
  token?: string;
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
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: mustMatch('password', 'confirmPassword')
    });

    const token = this.getPasswordResetToken();
    console.log('[reset-password] Component initialized, token extracted');
    
    this.router.navigate([], { relativeTo: this.route, replaceUrl: true, queryParams: {} });
    this.token = token ?? undefined;

    if (!token) {
      console.error('[reset-password] FAIL: No token found in URL');
      this.alertService.error('Reset token is missing. Please use the link from your email.');
      this.tokenStatus = TokenStatus.Invalid;
      return;
    }

    console.log('[reset-password] Validating token...');
    this.accountService.validateResetToken(token)
      .pipe(first())
      .subscribe({
        next: (response: any) => {
          console.log('[reset-password] SUCCESS: Token is valid');
          this.tokenStatus = TokenStatus.Valid;
        },
        error: (error: any) => {
          const message = typeof error === 'string'
            ? error
            : error?.error?.message || error?.message || 'Reset token validation failed.';
          console.error('[reset-password] FAIL: Token validation failed', { message, error });
          this.alertService.error(message);
          this.tokenStatus = TokenStatus.Invalid;
        }
      });
  }

  private getPasswordResetToken(): string | null {
    const queryToken = this.route.snapshot.queryParams['token'];
    const routeToken = this.route.snapshot.paramMap.get('token');
    return typeof queryToken === 'string' && queryToken.trim()
      ? queryToken.trim()
      : routeToken?.trim() || null;
  }

  get f() {
    return this.form.controls as any;
  }

  onSubmit() {
    this.submitted = true;
    this.alertService.clear();

    if (this.form.invalid) {
      console.error('[reset-password] FAIL: Form is invalid');
      return;
    }

    if (!this.token) {
      console.error('[reset-password] FAIL: Token is missing during submission');
      this.alertService.error('Reset token is missing. Please refresh the page.');
      return;
    }

    this.loading = true;
    console.log('[reset-password] Submitting password reset...');
    
    this.accountService.resetPassword(this.token, this.f.password.value, this.f.confirmPassword.value)
      .pipe(
        first(),
        finalize(() => {
          this.loading = false;
          console.log('[reset-password] Loading state stopped');
        })
      )
      .subscribe({
        next: (response: any) => {
          console.log('[reset-password] SUCCESS: Password reset completed');
          this.alertService.success('Password reset successful, you can now login', { keepAfterRouteChange: true });
          this.router.navigate(['../login'], { relativeTo: this.route });
        },
        error: (error: any) => {
          const message = typeof error === 'string'
            ? error
            : error?.error?.message || error?.message || 'Password reset failed. Please try again.';
          console.error('[reset-password] FAIL: Password reset failed', { message, error });
          this.alertService.error(message);
        }
      });
  }
}

