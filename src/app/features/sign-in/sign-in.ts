import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ApiError } from '../../core/api/api.types';
import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'pa-sign-in',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './sign-in.html',
})
export class SignIn {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly revealed = signal(false);
  protected readonly busy = signal(false);
  protected readonly submitted = signal(false);
  protected readonly error = signal('');

  protected invalid(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected forgotPassword(): void {
    this.error.set('Ask another platform administrator to reset your password.');
  }

  protected submit(): void {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.invalid) {
      this.error.set('Enter a valid email and password.');
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.busy.set(true);
    this.auth.login(email.trim(), password).subscribe({
      next: () => this.router.navigateByUrl('/tenants'),
      error: (err: ApiError) => {
        this.busy.set(false);
        this.error.set(
          err.code === 'ACCOUNT_LOCKED'
            ? 'Too many failed attempts. Try again in 15 minutes.'
            : err.code === 'INVALID_CREDENTIALS'
              ? "That email and password don't match a platform administrator."
              : err.message,
        );
      },
    });
  }
}
