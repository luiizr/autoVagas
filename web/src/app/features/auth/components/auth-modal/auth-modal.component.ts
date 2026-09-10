import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

export type AuthModalMode = 'login' | 'register';

@Component({
  selector: 'av-auth-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss',
})
export class AuthModalComponent {
  readonly mode = input.required<AuthModalMode>();
  readonly closed = output<void>();
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  readonly registerForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  error = '';

  close() {
    this.closed.emit();
  }

  submitLogin() {
    if (this.loginForm.invalid) return;
    this.error = '';
    this.auth.login(this.loginForm.getRawValue()).subscribe({
      next: () => this.close(),
      error: ({ error }) => (this.error = error?.error ?? 'Não foi possível entrar.'),
    });
  }

  submitRegister() {
    if (this.registerForm.invalid) return;
    this.error = '';
    this.auth.register(this.registerForm.getRawValue()).subscribe({
      next: () => this.close(),
      error: ({ error }) => (this.error = error?.error ?? 'Não foi possível criar a conta.'),
    });
  }
}
