import { Component } from '@angular/core'; import { RouterOutlet } from '@angular/router'; import { AppShellComponent } from './core/layout/app-shell/app-shell.component';
@Component({selector:'av-root',imports:[RouterOutlet,AppShellComponent],templateUrl:'./app.component.html',styleUrl:'./app.component.scss'}) export class AppComponent {}
