import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthModalComponent, type AuthModalMode } from '../../../features/auth/components/auth-modal/auth-modal.component';
import { AuthService } from '../../services/auth.service';
@Component({selector:'av-app-shell',imports:[RouterLink,AuthModalComponent],templateUrl:'./app-shell.component.html',styleUrl:'./app-shell.component.scss'}) export class AppShellComponent { readonly auth=inject(AuthService); authMode: AuthModalMode | null = null; openAuth(mode: AuthModalMode) { this.authMode = mode; } closeAuth() { this.authMode = null; } }
