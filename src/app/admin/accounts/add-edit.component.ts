import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first, finalize } from 'rxjs/operators';
import { AccountService, AlertService } from '@app/_services';
import { mustMatch } from '@app/_helpers';

@Component({
  selector: 'app-admin-account-add-edit',
  templateUrl: './add-edit.component.html',
  standalone: false
})
export class AddEditComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  id?: string;
  title = 'Create Account';
  loading = false;
  submitting = false;
  submitted = false;
  private loadTimeoutId?: number;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.id = this.route.snapshot.params['id'];

    this.form = this.formBuilder.group({
      title: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required],
      password: ['', this.id ? [Validators.minLength(6)] : [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['']
    }, {
      validator: mustMatch('password', 'confirmPassword')
    });

    if (this.id) {
      this.title = 'Edit Account';
      this.loading = true;
      this.cdr.detectChanges();

      this.loadTimeoutId = window.setTimeout(() => {
        if (this.loading) {
          this.loading = false;
          this.alertService.error('Request timed out');
          this.cdr.detectChanges();
        }
      }, 10000);

      this.accountService.getById(this.id)
        .pipe(
          first(),
          finalize(() => {
            this.loading = false;
            if (this.loadTimeoutId) {
              window.clearTimeout(this.loadTimeoutId);
              this.loadTimeoutId = undefined;
            }
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (x: any) => {
            this.form.patchValue(x);
            this.cdr.detectChanges();
          },
          error: (error: any) => {
            this.alertService.error(error);
            this.cdr.detectChanges();
          }
        });
    }
  }

  ngOnDestroy() {
    if (this.loadTimeoutId) {
      window.clearTimeout(this.loadTimeoutId);
      this.loadTimeoutId = undefined;
    }
  }

  get f() {
    return this.form.controls as any;
  }

  get isAddMode() {
    return !this.id;
  }

  onSubmit() {
    this.submitted = true;
    this.alertService.clear();

    if (this.form.invalid) {
      return;
    }

    this.submitting = true;
    const saveAccount = this.id ?
      () => this.accountService.update(this.id!, this.form.value) :
      () => this.accountService.create(this.form.value);

    const message = this.id ? 'Account updated' : 'Account created';

    saveAccount()
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success(message, { keepAfterRouteChange: true });
          this.router.navigateByUrl('/admin/accounts');
        },
        error: (error: any) => {
          this.alertService.error(error);
          this.submitting = false;
          this.cdr.detectChanges();
        }
      });
  }
}
